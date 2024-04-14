import { ExtensionCommand } from '@repo/extension-core';
import { getExtIconURL } from '../utils/helper';
import { useCommandPanelStore } from '../stores/command-panel.store';
import emitter from '../lib/mitt';
import preloadAPI from '../utils/preloadAPI';
import { useCommandNavigate } from './useCommandRoute';
import { CommandLaunchContext } from '@repo/extension';
import { ExtensionDataBase } from '#common/interface/extension.interface';

export interface ExecuteCommandPayload {
  commandIcon: string;
  command: ExtensionCommand;
  extension: ExtensionDataBase;
  launchContext: CommandLaunchContext;
}

export function useCommand() {
  const setPanelHeader = useCommandPanelStore.use.setHeader();
  const addPanelStatus = useCommandPanelStore.use.addStatus();
  const removePanelStatus = useCommandPanelStore.use.removeStatus();

  const navigate = useCommandNavigate();

  async function checkCommandConfig({
    command,
    extension,
    commandIcon,
    launchContext,
  }: Omit<ExecuteCommandPayload, 'extension'> & {
    extension: Pick<ExtensionDataBase, 'id' | 'name' | 'title'>;
  }) {
    if (!command.config || command.config.length === 0) return true;

    const configState = await preloadAPI.main.invokeIpcMessage(
      'extension-config:need-input',
      extension.id,
      command.name,
    );
    if ('$isError' in configState) {
      addPanelStatus({
        type: 'error',
        title: configState.message,
      });
      return false;
    }

    if (configState.requireInput) {
      const isCommand = configState.type === 'command';
      const configId = isCommand
        ? `${extension.id}:${command.name}`
        : extension.id;
      navigate(`/configs/${configId}`, {
        panelHeader: {
          subtitle: isCommand ? extension.name : '',
          icon: getExtIconURL(commandIcon, extension.id),
          title: isCommand ? command.title : extension.name,
        },
        data: {
          config: configState.config,
          executeCommand: { launchContext, command, extension, commandIcon },
        },
      });

      return false;
    }

    return true;
  }
  async function executeCommand({
    command,
    extension,
    commandIcon,
    launchContext,
  }: ExecuteCommandPayload) {
    const isConfigInputted = await checkCommandConfig({
      command,
      extension,
      commandIcon,
      launchContext,
    });
    if (!isConfigInputted) return;

    const updatePanelHeader = () => {
      setPanelHeader({
        title: command.title,
        subtitle: extension.title,
        icon: getExtIconURL(commandIcon, extension.id),
      });
      removePanelStatus('command-missing-args');
    };

    if (command.type === 'view') {
      updatePanelHeader();
      navigate(`/extensions/${extension.id}/${command.name}/view`, {
        data: launchContext,
      });
    } else if (command.type === 'view:json') {
      updatePanelHeader();
      navigate(`/extensions/${extension.id}/${command.name}/view-json`, {
        data: launchContext,
      });
    } else if (command.type === 'script') {
      preloadAPI.main
        .invokeIpcMessage('extension:run-script-command', {
          launchContext,
          commandId: command.name,
          extensionId: extension.id,
        })
        .then((result) => {
          if ('$isError' in result) {
            addPanelStatus({
              type: 'error',
              title: 'Error!',
              description: result.message,
            });
            return;
          }

          updatePanelHeader();
        });
    } else {
      updatePanelHeader();
      emitter.emit('execute-command', {
        command,
        extension,
        commandIcon,
        launchContext,
      });
    }
  }

  return { executeCommand, checkCommandConfig };
}
