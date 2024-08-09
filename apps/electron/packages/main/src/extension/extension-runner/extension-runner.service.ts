import {
  ExtensionBrowserTabContext,
  ExtensionCommandExecutePayload,
  ExtensionCommandJSONViewData,
  ExtensionCommandProcess,
} from '#packages/common/interface/extension.interface';
import { CommandLaunchBy, ExtensionAPI } from '@altdot/extension';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { ExtensionConfigService } from '../extension-config/extension-config.service';
import { BrowserExtensionService } from '/@/browser-extension/browser-extension.service';
import { ExtensionLoaderService } from '/@/extension-loader/extension-loader.service';
import {
  CommandJSON,
  CommandJSONValidation,
} from '@altdot/extension/dist/validation/command-json.validation';
import type { Cache } from 'cache-manager';
import { DBService } from '/@/db/db.service';
import { BrowserWindowService } from '/@/browser-window/browser-window.service';
import { IPCSendPayload } from '#packages/common/interface/ipc-events.interface';
import { extensionErrors } from '/@/db/schema/extension.schema';
import { ClipboardService } from '/@/clipboard/clipboard.service';
import { shell } from 'electron';
import { parseJSON } from '@altdot/shared';
import { debugLog } from '#packages/common/utils/helper';

@Injectable()
export class ExtensionRunnerService {
  private runningCommands: Map<string, ExtensionCommandProcess> = new Map();
  private executionResolvers = new Map<
    string,
    PromiseWithResolvers<ExtensionAPI.Command.LaunchResult>
  >();

  constructor(
    private dbService: DBService,
    private clipboard: ClipboardService,
    private browserWindow: BrowserWindowService,
    private extensionLoader: ExtensionLoaderService,
    private extensionConfig: ExtensionConfigService,
    private browserExtension: BrowserExtensionService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

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

  private async handleCommandJSON(
    data: CommandJSON,
    detail: ExtensionCommandJSONViewData['detail'],
  ) {
    if (data.action) {
      switch (data.action.type) {
        case 'copy':
          this.clipboard.write(
            'text',
            typeof data.action.content === 'string'
              ? data.action.content
              : JSON.stringify(data.action.content),
          );
          break;
        case 'open-url':
          shell.openExternal(data.action.url);
          break;
        case 'paste':
          await this.clipboard.paste(data.action.content);
          break;
        case 'show-in-folder':
          shell.openPath(data.action.path);
          break;
      }
    } else if (data.view) {
      const commandWindow = await this.browserWindow.get('command');
      commandWindow.sendMessage('command-window:open-json-view', {
        detail,
        view: data.view,
      });
    }
  }

  handleExecutionChange(
    type: IPCSendPayload<'extension:command-exec-change'>[0],
    detail: IPCSendPayload<'extension:command-exec-change'>[1],
    result: IPCSendPayload<'extension:command-exec-change'>[2],
  ) {
    const { extensionId, runnerId, title } = detail;
    if (type === 'start') {
      this.runningCommands.set(runnerId, detail);
    } else {
      const resolver = this.executionResolvers.get(runnerId);
      if (resolver) resolver.resolve(result);

      if (!result.success) {
        this.dbService.db.insert(extensionErrors).values({
          title,
          extensionId,
          message: result.errorMessage,
        });
      } else if (
        detail.type === 'script' &&
        detail.launchBy !== CommandLaunchBy.WORKFLOW
      ) {
        const commandJSON = CommandJSONValidation.safeParse(
          parseJSON(result.result as string, null),
        );
        if (commandJSON.success) {
          this.handleCommandJSON(commandJSON.data, {
            icon: detail.icon,
            title: detail.title,
            commandId: detail.commandId,
            extensionId: detail.extensionId,
            subtitle: detail.extensionTitle,
          });
        } else {
          debugLog(JSON.stringify(commandJSON.error, null, 2));
        }
      }

      // eslint-disable-next-line drizzle/enforce-delete-with-where
      this.runningCommands.delete(runnerId);
    }

    if (detail.noEmit) return;

    this.browserWindow.sendMessageToAllWindows({
      name: 'extension:running-commands-change',
      args: [this.getRunningCommands()],
    });
  }

  getRunningCommands() {
    return [...this.runningCommands.values()];
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
}
