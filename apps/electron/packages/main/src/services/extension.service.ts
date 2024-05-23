import type { ExtensionCommandExecutePayload } from '#packages/common/interface/extension.interface';
import type ExtensionAPI from '@repo/extension-core/types/extension-api';
import ExtensionLoader from '../utils/extension/ExtensionLoader';
import IPCMain from '../utils/ipc/IPCMain';
import WindowCommand from '../window/command-window';
import BrowserService from './browser.service';
import DBService from './database/database.service';
import type { ExtensionCommandType } from '@repo/extension-core';

class ExtensionService {
  private static _instance: ExtensionService;

  static get instance() {
    return this._instance || (this._instance = new ExtensionService());
  }

  private executionResolvers = new Map<
    string,
    PromiseWithResolvers<ExtensionAPI.runtime.LaunchCommandResult>
  >();

  constructor() {
    this.initIPCEventListener();
  }

  private initIPCEventListener() {
    IPCMain.on('extension:finish-command-exec', (_, runnerId, result) => {
      const resolver = this.executionResolvers.get(runnerId);
      if (!resolver) return;

      resolver.resolve(result);
    });
  }

  async executeCommandAndWait(executePayload: ExtensionCommandExecutePayload) {
    const resolver =
      Promise.withResolvers<ExtensionAPI.runtime.LaunchCommandResult>();

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
        : BrowserService.instance.getActiveTab(),
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
      IPCMain.sendToWindow('command', 'command-window:input-config', {
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
        const runnerId = await IPCMain.instance.invoke(
          'shared-process',
          'shared-window:execute-command',
          executeCommandPayload,
        );

        // check if command window is closed
        WindowCommand.instance.toggleWindow(true);
        IPCMain.sendToWindow(
          'command',
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
        return IPCMain.instance.invoke(
          'shared-process',
          'shared-window:execute-command',
          executeCommandPayload,
        );
      case 'view':
        WindowCommand.instance.toggleWindow(true);
        IPCMain.sendToWindow('command', 'command-window:open-command-view', {
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
    IPCMain.sendToWindow(
      'shared-process',
      'shared-window:stop-execute-command',
      runnerId,
    );
  }
}

export default ExtensionService;
