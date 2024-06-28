import { Inject, Injectable } from '@nestjs/common';
import { DBService } from '../db/db.service';
import { OnAppReady } from '../common/hooks/on-app-ready.hook';
import { SQL, eq, lt, sql } from 'drizzle-orm';
import { extensionErrors, extensions } from '../db/schema/extension.schema';
import { CommandLaunchBy } from '@alt-dot/extension';
import { GlobalShortcutService } from '../global-shortcut/global-shortcut.service';
import { LoggerService } from '../logger/logger.service';
import { IPCSendPayload } from '#packages/common/interface/ipc-events.interface';
import {
  ExtensionBrowserTabContext,
  ExtensionCommandExecutePayload,
  ExtensionCommandProcess,
} from '#packages/common/interface/extension.interface';
import ExtensionAPI from '@alt-dot/extension-core/types/extension-api';
import { BrowserWindowService } from '../browser-window/browser-window.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { ExtensionLoaderService } from '../extension-loader/extension-loader.service';
import { ExtensionCommandType } from '@alt-dot/shared';
import { ExtensionConfigService } from './extension-config/extension-config.service';
import { BrowserExtensionService } from '../browser-extension/browser-extension.service';
import { EXTENSION_BUILT_IN_ID } from '#packages/common/utils/constant/extension.const';
import {
  ExtensionListFilterPayload,
  ExtensionListItemModel,
  ExtensionUpdatePayload,
  ExtensionWithCredListItemModel,
} from './extension.interface';
import { DATABASE_CHANGES_ALL_ARGS } from '#packages/common/utils/constant/constant';
import { ExtensionManifest } from '@alt-dot/extension-core';

const MAX_EXT_ERROR_AGE_DAY = 30;

@Injectable()
export class ExtensionService implements OnAppReady {
  private runningCommands: Map<string, ExtensionCommandProcess> = new Map();
  private executionResolvers = new Map<
    string,
    PromiseWithResolvers<ExtensionAPI.runtime.command.LaunchResult>
  >();

  constructor(
    private dbService: DBService,
    private logger: LoggerService,
    private browserWindow: BrowserWindowService,
    private globalShortcut: GlobalShortcutService,
    private extensionLoader: ExtensionLoaderService,
    private extensionConfig: ExtensionConfigService,
    private browserExtension: BrowserExtensionService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async onAppReady() {
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

  async executeCommandAndWait(executePayload: ExtensionCommandExecutePayload) {
    const resolver =
      Promise.withResolvers<ExtensionAPI.runtime.command.LaunchResult>();

    const runnerId = await this.executeCommand(executePayload, 'script');
    if (!runnerId) throw new Error("Config hasn't been inputted");

    this.executionResolvers.set(runnerId, resolver);

    return resolver.promise;
  }

  async executeCommand(
    executePayload: ExtensionCommandExecutePayload,
    filterCommandType?: ExtensionCommandType,
  ): Promise<string | null> {
    const payload: ExtensionCommandExecutePayload = {
      ...executePayload,
      browserCtx: Object.hasOwn(executePayload, 'browserCtx')
        ? executePayload.browserCtx
        : await this.getBrowserCtx(),
    };
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

    if (filterCommandType && command.type !== filterCommandType) {
      throw new Error(`It only supported "${filterCommandType}" command type`);
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

      return null;
    }

    const executeCommandPayload = {
      ...payload,
      command,
      commandFilePath,
    };

    switch (command.type) {
      case 'view:json': {
        const windowSharedProcess =
          await this.browserWindow.get('shared-process');
        const runnerId = await windowSharedProcess.invoke(
          'shared-window:execute-command',
          executeCommandPayload,
        );

        const windowCommand = await this.browserWindow.get('command');
        await windowCommand.toggleWindow(true);
        await windowCommand.sendMessage(
          'command-command-window:open-json-view',
          {
            ...payload,
            runnerId,
            title: command.title,
            subtitle: command.extension.title,
            icon: command.icon || command.extension.icon,
          },
        );

        return runnerId;
      }
      case 'script':
      case 'action': {
        const windowSharedProcess =
          await this.browserWindow.get('shared-process');
        return windowSharedProcess.invoke(
          'shared-window:execute-command',
          executeCommandPayload,
        );
      }
      case 'view': {
        const windowCommand = await this.browserWindow.get('command');
        windowCommand.toggleWindow(true);
        windowCommand.sendMessage('command-command-window:open-view', {
          ...payload,
          title: command.title,
          subtitle: command.extension.title,
          icon: command.icon || command.extension.icon,
        });
        return null;
      }
      default:
        throw new Error(
          `Command with "${command.type}" type doesn't have handler`,
        );
    }
  }

  async stopCommandExecution(runnerId: string) {
    const windowSharedProcess = await this.browserWindow.get('shared-process');
    windowSharedProcess.sendMessage(
      'shared-window:stop-execute-command',
      runnerId,
    );
  }
}

@Injectable()
export class ExtensionQueryService {
  constructor(private dbService: DBService) {}

  async get(extensionId: string) {
    const extension = await this.dbService.db.query.extensions.findFirst({
      with: { commands: {} },
      where(fields, operators) {
        return operators.eq(fields.id, extensionId);
      },
    });

    return extension ?? null;
  }

  exists(extensionId: string): Promise<boolean> {
    return this.dbService.db.query.extensions
      .findFirst({
        columns: { id: true },
        where(fields, operators) {
          return operators.eq(fields.id, extensionId);
        },
      })
      .then((result) => Boolean(result));
  }

  async update(extensionId: string, value: ExtensionUpdatePayload) {
    const result = await this.dbService.db
      .update(extensions)
      .set(value)
      .where(eq(extensions.id, extensionId))
      .returning();

    this.dbService.emitChanges({
      'database:get-extension': [extensionId],
      'database:get-extension-list': [DATABASE_CHANGES_ALL_ARGS],
    });

    return result;
  }

  list(
    filter: ExtensionListFilterPayload = {},
  ): Promise<ExtensionListItemModel[]> {
    return this.dbService.db.query.extensions.findMany({
      columns: {
        id: true,
        path: true,
        icon: true,
        title: true,
        config: true,
        version: true,
        isError: true,
        isLocal: true,
        updatedAt: true,
        isDisabled: true,
        description: true,
        errorMessage: true,
      },
      with: {
        commands: {},
      },
      extras: {
        errorsCount:
          sql<number>`(SELECT COUNT(*) FROM ${extensionErrors} WHERE ${extensionErrors.extensionId} = extensions.id)`.as(
            'errors_count',
          ),
      },
      where: (fields, operators) => {
        const filters: SQL<unknown>[] = [];

        if (filter?.activeOnly) {
          filters.push(
            operators.eq(fields.isDisabled, false),
            operators.eq(fields.isError, false),
          );
        }
        if (filter?.excludeBuiltIn) {
          filters.push(
            operators.notInArray(
              fields.id,
              Object.values(EXTENSION_BUILT_IN_ID),
            ),
          );
        }

        if (filters.length === 0) return;

        return operators.and(...filters);
      },
    });
  }

  listCredentials(): Promise<ExtensionWithCredListItemModel[]> {
    return this.dbService.db.query.extensions.findMany({
      columns: {
        id: true,
        title: true,
        credentials: true,
      },
      where(fields, operators) {
        return operators.isNotNull(fields.credentials);
      },
    });
  }

  async getManifest(extensionId: string): Promise<ExtensionManifest | null> {
    const extension = await this.dbService.db.query.extensions.findFirst({
      where(fields, operators) {
        return operators.and(
          operators.eq(fields.isError, false),
          operators.eq(fields.id, extensionId),
          operators.eq(fields.isDisabled, false),
        );
      },
      with: {
        commands: {},
      },
    });
    if (!extension) return null;

    return {
      ...extension,
      categories: [],
      $apiVersion: '',
    } as ExtensionManifest;
  }
}
