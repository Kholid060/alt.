import { Inject, Injectable } from '@nestjs/common';
import { DBService } from '../db/db.service';
import { OnAppReady } from '../common/hooks/on-app-ready.hook';
import { lt } from 'drizzle-orm';
import { extensionErrors, extensions } from '../db/schema/extension.schema';
import { CommandLaunchBy } from '@altdot/extension/dist/interfaces/command.interface';
import { GlobalShortcutService } from '../global-shortcut/global-shortcut.service';
import { LoggerService } from '../logger/logger.service';
import { IPCSendPayload } from '#packages/common/interface/ipc-events.interface';
import {
  ExtensionBrowserTabContext,
  ExtensionCommandExecutePayload,
  ExtensionCommandProcess,
} from '#packages/common/interface/extension.interface';
import { ExtensionAPI } from '@altdot/extension';
import { BrowserWindowService } from '../browser-window/browser-window.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { ExtensionLoaderService } from '../extension-loader/extension-loader.service';
import { ExtensionConfigService } from './extension-config/extension-config.service';
import { BrowserExtensionService } from '../browser-extension/browser-extension.service';
import { EXTENSION_BUILT_IN_ID } from '#packages/common/utils/constant/extension.const';
import { ExtensionCommandService } from './extension-command/extension-command.service';
import { ExtensionCommandUpdatePayload } from './extension-command/extension-command.interface';

const MAX_EXT_ERROR_AGE_DAY = 3;

@Injectable()
export class ExtensionService implements OnAppReady {
  private runningCommands: Map<string, ExtensionCommandProcess> = new Map();
  private executionResolvers = new Map<
    string,
    PromiseWithResolvers<ExtensionAPI.Command.LaunchResult>
  >();

  constructor(
    private dbService: DBService,
    private logger: LoggerService,
    private browserWindow: BrowserWindowService,
    private globalShortcut: GlobalShortcutService,
    private extensionLoader: ExtensionLoaderService,
    private extensionConfig: ExtensionConfigService,
    private extensionCommand: ExtensionCommandService,
    private browserExtension: BrowserExtensionService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async onAppReady() {
    // Built-in extension
    await this.dbService.db
      .insert(extensions)
      .values({
        path: '',
        author: 'user',
        description: '',
        version: '0.0.0',
        icon: 'icon:FileCode',
        title: 'User Scripts',
        id: EXTENSION_BUILT_IN_ID.userScript,
        name: EXTENSION_BUILT_IN_ID.userScript,
      })
      .onConflictDoNothing({ target: extensions.id });

    // Register extension command shortcuts
    const commands = await this.dbService.db.query.extensionCommands.findMany({
      columns: {
        name: true,
        shortcut: true,
        extensionId: true,
      },
      where(fields, operators) {
        return operators.isNotNull(fields.shortcut);
      },
    });
    commands.map((command) => {
      this.toggleShortcut(command.extensionId, command.name, command.shortcut);
    });

    // Delete old errors
    const minDate = new Date(
      new Date().setDate(new Date().getDate() - MAX_EXT_ERROR_AGE_DAY),
    );
    this.dbService.db
      .delete(extensionErrors)
      .where(lt(extensionErrors.createdAt, minDate.toISOString()));
  }

  private async getBrowserCtx(): Promise<
    ExtensionBrowserTabContext | undefined
  > {
    return this.cacheManager.wrap(
      'extension:browser-ctx',
      async () => {
        const browser = await this.browserExtension.getFocused();
        if (!browser) return undefined;

        return {
          url: browser.tab.url,
          tabId: browser.tab.id,
          browserId: browser.id,
          title: browser.tab.title,
        };
      },
      2500,
    );
  }

  handleExecutionChange(
    type: IPCSendPayload<'extension:command-exec-change'>[0],
    detail: IPCSendPayload<'extension:command-exec-change'>[1],
    result: IPCSendPayload<'extension:command-exec-change'>[2],
  ) {
    const { extensionId, extensionTitle, icon, runnerId, title } = detail;
    if (type === 'start') {
      this.runningCommands.set(runnerId, {
        icon,
        title,
        runnerId,
        extensionId,
        extensionTitle,
      });
    } else {
      const resolver = this.executionResolvers.get(runnerId);
      if (resolver) resolver.resolve(result);

      if (!result.success) {
        this.dbService.db.insert(extensionErrors).values({
          title,
          extensionId,
          message: result.errorMessage,
        });
      }

      // eslint-disable-next-line drizzle/enforce-delete-with-where
      this.runningCommands.delete(runnerId);
    }

    this.browserWindow.sendMessageToAllWindows({
      name: 'extension:running-commands-change',
      args: [this.getRunningCommands()],
    });
  }

  getRunningCommands() {
    return [...this.runningCommands.values()];
  }

  toggleShortcut(extensionId: string, commandId: string, keys: string | null) {
    const shortcutId = `${extensionId}:${commandId}`;
    this.globalShortcut.unregisterById(shortcutId);

    if (!keys) return;

    this.globalShortcut.register({
      keys,
      callback: async () => {
        try {
          await this.executeCommand({
            commandId,
            extensionId,
            launchContext: {
              args: {},
              launchBy: CommandLaunchBy.USER,
            },
          });
        } catch (error) {
          this.logger.error(['ExtensionService', 'toggleShortcut'], error);
        }
      },
      id: shortcutId,
    });
  }

  async executeCommand(
    executePayload: ExtensionCommandExecutePayload,
    options?: { waitUntilFinished?: boolean },
  ): Promise<string | ExtensionAPI.Command.LaunchResult | null>;
  async executeCommand(
    executePayload: ExtensionCommandExecutePayload,
    options?: { waitUntilFinished?: false },
  ): Promise<string | null>;
  async executeCommand(
    executePayload: ExtensionCommandExecutePayload,
    options?: { waitUntilFinished?: true },
  ): Promise<ExtensionAPI.Command.LaunchResult | null>;
  async executeCommand(
    executePayload: ExtensionCommandExecutePayload,
    options?: { waitUntilFinished?: boolean },
  ): Promise<unknown> {
    const payload: ExtensionCommandExecutePayload = executePayload;
    const { commandId, extensionId } = payload;

    const command = await this.dbService.db.query.extensionCommands.findFirst({
      where(fields, operators) {
        return operators.and(
          operators.eq(fields.name, commandId),
          operators.eq(fields.extensionId, extensionId),
        );
      },
      with: {
        extension: {},
      },
    });
    if (!command) throw new Error("Coudln't find command");
    if (command.extension.isDisabled) {
      throw new Error(
        `The extension of the "${command.title}" command is disabled`,
      );
    }
    if (command.isDisabled) throw new Error('This command is disabled');

    if (
      !payload.browserCtx &&
      command.extension.permissions?.some((permission) =>
        permission.startsWith('browser'),
      )
    ) {
      payload.browserCtx = await this.getBrowserCtx();
    }

    const commandFilePath =
      command.path ||
      (await this.extensionLoader.getPath(extensionId, 'base', commandId));
    if (!commandFilePath) throw new Error("Coudln't find command file");

    const commandConfig = await this.extensionConfig.isInputted(
      extensionId,
      commandId,
    );
    if (typeof commandConfig === 'string') {
      const windowCommand = await this.browserWindow.get('command');
      await windowCommand.sendMessage('command-window:input-config', {
        commandId,
        extensionId,
        type: commandConfig,
        executeCommandPayload: payload,
      });

      throw new Error("Config hasn't been inputted");
    }

    const executeCommandPayload = {
      ...payload,
      command,
      commandFilePath,
    };

    let runnerId: string | null = null;

    switch (command.type) {
      case 'view:json': {
        const windowSharedProcess =
          await this.browserWindow.get('shared-process');
        runnerId = await windowSharedProcess.invoke(
          'shared-window:execute-command',
          executeCommandPayload,
        );

        const windowCommand = await this.browserWindow.get('command');
        await windowCommand.toggleWindow(true);
        await windowCommand.sendMessage('command-window:open-json-view', {
          ...payload,
          runnerId,
          title: command.title,
          subtitle: command.extension.title,
          icon: command.icon || command.extension.icon,
        });
        break;
      }
      case 'script':
      case 'action': {
        const windowSharedProcess =
          await this.browserWindow.get('shared-process');
        runnerId = await windowSharedProcess.invoke(
          'shared-window:execute-command',
          executeCommandPayload,
        );

        break;
      }
      case 'view': {
        const windowCommand = await this.browserWindow.get('command');
        windowCommand.toggleWindow(true);
        windowCommand.sendMessage('command-window:open-view', {
          ...payload,
          title: command.title,
          subtitle: command.extension.title,
          icon: command.icon || command.extension.icon,
        });
        break;
      }
      default:
        throw new Error(
          `Command with "${command.type}" type doesn't have handler`,
        );
    }

    if (options?.waitUntilFinished && runnerId) {
      const resolver =
        Promise.withResolvers<ExtensionAPI.Command.LaunchResult>();
      this.executionResolvers.set(runnerId, resolver);

      return resolver.promise;
    }

    return runnerId;
  }

  async stopCommandExecution(runnerId: string) {
    const windowSharedProcess = await this.browserWindow.get('shared-process');
    windowSharedProcess.sendMessage(
      'shared-window:stop-execute-command',
      runnerId,
    );
  }

  async updateCommand(
    id: { extensionId: string; commandId: string },
    data: ExtensionCommandUpdatePayload,
  ) {
    await this.extensionCommand.updateCommand(id, data);

    if (data.shortcut) {
      this.toggleShortcut(id.extensionId, id.commandId, data.shortcut);
    }
  }
}
