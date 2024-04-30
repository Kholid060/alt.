import type { ExtensionCommandExecutePayload } from '#packages/common/interface/extension.interface';
import ExtensionLoader from '../utils/extension/ExtensionLoader';
import IPCMain from '../utils/ipc/IPCMain';
import WindowCommand from '../window/command-window';
import DBService from './database/database.service';

class SharedProcessService {
  static async executeExtensionCommand(
    payload: ExtensionCommandExecutePayload,
  ): Promise<string | null> {
    const { commandId, extensionId } = payload;

    const command = await DBService.instance.extension.getCommand({
      commandId,
      extensionId,
    });
    if (!command) throw new Error("Coudln't find command");
    if (command.extension.isDisabled) return null;

    const commandFilePath = ExtensionLoader.instance.getPath(
      extensionId,
      'base',
      commandId,
    );
    if (!commandFilePath) throw new Error("Coudln't find command file");

    const commandConfig =
      await DBService.instance.extension.isCommandConfigInputted(
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
        const processId = await IPCMain.instance.invoke(
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
            processId,
            title: command.title,
            subtitle: command.extension.title,
            icon: command.icon || command.extension.icon,
          },
        );

        return processId;
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

    return null;
  }

  static stopExecuteExtensionCommand(processId: string) {
    IPCMain.sendToWindow(
      'shared-process',
      'shared-window:stop-execute-command',
      processId,
    );
  }
}

export default SharedProcessService;
