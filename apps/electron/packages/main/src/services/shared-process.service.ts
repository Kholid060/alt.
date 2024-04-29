import type { ExtensionCommandExecutePayload } from '#packages/common/interface/extension.interface';
import IPCMain from '../utils/ipc/IPCMain';
import DBService from './database/database.service';

class SharedProcessService {
  static async executeExtensionCommand(
    payload: ExtensionCommandExecutePayload,
  ) {
    const { commandId, extensionId } = payload;

    const command = await DBService.instance.extension.getCommand({
      commandId,
      extensionId,
    });
    if (!command) throw new Error("Coudln't find command");

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
    };

    switch (command.type) {
      case 'view:json': {
        const processId = await IPCMain.instance.invoke(
          'shared-process',
          'shared-window:execute-command',
          executeCommandPayload,
        );

        // check if command window is closed
        IPCMain.sendToWindow('command', 'command-window:open-json-view', {
          ...payload,
          processId,
          title: command.title,
          subtitle: command.extension.title,
          icon: command.icon || command.extension.icon,
        });

        return processId;
      }
      case 'action':
        return IPCMain.instance.invoke(
          'shared-process',
          'shared-window:execute-command',
          executeCommandPayload,
        );
      default:
        throw new Error(
          `Commnad with "${command.type}" type doesn't have handler`,
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
