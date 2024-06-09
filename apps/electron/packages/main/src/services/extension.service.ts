import type {
  ExtensionBrowserTabContext,
  ExtensionCommandExecutePayload,
} from '#packages/common/interface/extension.interface';
import type ExtensionAPI from '@repo/extension-core/types/extension-api';
import ExtensionLoader from '../utils/extension/ExtensionLoader';
import IPCMain from '../utils/ipc/IPCMain';
import WindowCommand from '../window/command-window';
import BrowserService from './browser.service';
import DBService from './database/database.service';
import type { ExtensionCommandType } from '@repo/extension-core';
import WindowSharedProcess from '../window/shared-process-window';
import { CommandLaunchBy } from '@repo/extension';
import { logger } from '../lib/log';
import GlobalShortcut from '../utils/GlobalShortcuts';

class ExtensionService {
  private static _instance: ExtensionService;
  static get instance() {
    return this._instance || (this._instance = new ExtensionService());
  }

  private executionResolvers = new Map<
    string,
    PromiseWithResolvers<ExtensionAPI.runtime.command.LaunchResult>
  >();
  private browserCtxCache: {
    fetchedAt: number;
    data: ExtensionBrowserTabContext;
  } | null = null;

  constructor() {
    this.init();
  }

  private init() {
    IPCMain.on(
      'extension:finish-command-exec',
      (_, { runnerId, extensionId, title }, result) => {
        const resolver = this.executionResolvers.get(runnerId);
        if (resolver) resolver.resolve(result);

        if (!result.success) {
          DBService.instance.extension.insertError({
            title,
            extensionId,
            message: result.errorMessage,
          });
        }
      },
    );
    DBService.instance.extension.deleteOldErrors().catch(console.error);
  }

  async registerAllShortcuts() {
    const commands =
      await DBService.instance.db.query.extensionCommands.findMany({
        columns: {
          name: true,
          shortcut: true,
        },
        with: {
          extension: { columns: { id: true } },
        },
        where(fields, operators) {
          return operators.isNotNull(fields.shortcut);
        },
      });
    commands.map((command) => {
      if (!command.extension) return;

      this.toggleShortcut(command.extension.id, command.name, command.shortcut);
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

  private async getBrowserCtx(): Promise<
    ExtensionBrowserTabContext | undefined
  > {
    if (
      this.browserCtxCache &&
      Date.now() - this.browserCtxCache.fetchedAt <= 2500
    ) {
      return this.browserCtxCache.data;
    }

    const browser = await BrowserService.instance.getFocused();
    if (!browser) return undefined;

    return {
      url: browser.tab.url,
      tabId: browser.tab.id,
      browserId: browser.id,
      title: browser.tab.title,
    };
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

    const command = await DBService.instance.extension.getCommand({
      commandId,
      extensionId,
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
      ExtensionLoader.instance.getPath(extensionId, 'base', commandId);
    if (!commandFilePath) throw new Error("Coudln't find command file");

    const commandConfig = await DBService.instance.extension.isConfigInputted(
      extensionId,
      commandId,
    );
    if (commandConfig.requireInput) {
      await WindowCommand.instance.sendMessage('command-window:input-config', {
        commandId,
        extensionId,
        type: commandConfig.type,
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
        const runnerId = await WindowSharedProcess.instance.invoke(
          'shared-window:execute-command',
          executeCommandPayload,
        );

        // check if command window is closed
        await WindowCommand.instance.toggleWindow(true);
        await WindowCommand.instance.sendMessage(
          'command-window:open-command-json-view',
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
      case 'action':
        return WindowSharedProcess.instance.invoke(
          'shared-window:execute-command',
          executeCommandPayload,
        );
      case 'view':
        WindowCommand.instance.toggleWindow(true);
        WindowCommand.instance.sendMessage('command-window:open-command-view', {
          ...payload,
          title: command.title,
          subtitle: command.extension.title,
          icon: command.icon || command.extension.icon,
        });
        return null;
      default:
        throw new Error(
          `Command with "${command.type}" type doesn't have handler`,
        );
    }
  }

  stopCommandExecution(runnerId: string) {
    WindowSharedProcess.instance.sendMessage(
      'shared-window:stop-execute-command',
      runnerId,
    );
  }

  toggleShortcut(extensionId: string, commandId: string, keys: string | null) {
    const shortcutId = `${extensionId}:${commandId}`;
    GlobalShortcut.instance.unregisterById(shortcutId);

    if (!keys) return;

    GlobalShortcut.instance.register({
      keys,
      callback: async () => {
        try {
          await ExtensionService.instance.executeCommand({
            commandId,
            extensionId,
            launchContext: {
              args: {},
              launchBy: CommandLaunchBy.USER,
            },
          });
        } catch (error) {
          logger('error', ['ExtensionService', 'toggleShortcut'], error);
        }
      },
      id: shortcutId,
    });
  }
}

export default ExtensionService;
