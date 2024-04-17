import type { ExtensionConfig } from '@repo/extension-core';
import { sendIpcMessageToWindow } from '../ipc/ipc-main';
import ExtensionCommandScriptRunner from './ExtensionCommandScriptRunner';
import extensionsDB from '/@/db/extension.db';
import WindowsManager from '/@/window/WindowsManager';
import { toggleCommandWindow } from '/@/window/command-window';
import type { CommandLaunchContext } from '@repo/extension';
import type {
  DatabaseExtension,
  DatabaseExtensionCommand,
} from '/@/interface/database.interface';

async function extensionCommandRunner({
  command,
  extension,
  launchContext,
}: {
  extension: DatabaseExtension;
  command: DatabaseExtensionCommand;
  launchContext: CommandLaunchContext;
}) {
  const commandWindow =
    await WindowsManager.instance.restoreOrCreateWindow('command');
  const sendMesageToCommandWindow = sendIpcMessageToWindow(commandWindow);

  const configId = `${extension.id}:${command.name}`;
  const isHasConfig =
    command.config && command.config.length > 0
      ? Boolean(
          await extensionsDB.query.configs.findFirst({
            columns: { configId: true },
            where(fields, operators) {
              return operators.eq(fields.configId, configId);
            },
          }),
        )
      : true;
  if (!isHasConfig) {
    sendMesageToCommandWindow('extension-config:open', {
      configId,
      launchContext,
      runCommand: true,
      commandTitle: command.title,
      extensionName: extension.title,
      config: command.config as ExtensionConfig[],
      commandIcon: command.icon ?? extension.icon,
    });
    return;
  }

  if (command.type === 'script') {
    await ExtensionCommandScriptRunner.instance.runScript({
      extensionId: extension.id,
      launchContext,
      commandId: command.name,
    });
    return;
  }

  toggleCommandWindow(true);

  sendMesageToCommandWindow('command:execute', {
    launchContext,
    commandId: command.name,
    extensionId: extension.id,
  });
}

export default extensionCommandRunner;
