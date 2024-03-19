import { ExtensionCommand } from '@repo/extension-core';
import { getCommandIcon } from '../utils/helper';
import { useCommandPanelStore } from '../stores/command-panel.store';
import emitter from '../lib/mitt';
import preloadAPI from '../utils/preloadAPI';
import { useCommandNavigate } from './useCommandRoute';
import { CommandLaunchContext } from '@repo/extension';

export function useCommand() {
  const setPanelHeader = useCommandPanelStore.use.setHeader();
  const addPanelStatus = useCommandPanelStore.use.addStatus();
  const removePanelStatus = useCommandPanelStore.use.removeStatus();

  const navigate = useCommandNavigate();

  function executeCommand({
    command,
    extensionId,
    extensionName,
    launchContext,
  }: {
    extensionId: string;
    extensionName: string;
    command: ExtensionCommand;
    launchContext: CommandLaunchContext;
  }) {
    const updatePanelHeader = () => {
      setPanelHeader({
        title: command.title,
        subtitle: extensionName,
        icon: getCommandIcon(command, extensionId),
      });
      removePanelStatus('command-missing-args');
    };

    if (command.type === 'view') {
      updatePanelHeader();
      navigate(`/extensions/${extensionId}/${command.name}/view`, {
        data: launchContext,
      });
    } else if (command.type === 'script') {
      preloadAPI.main
        .invokeIpcMessage('extension:run-script-command', {
          launchContext,
          commandId: command.name,
          extensionId: extensionId,
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
        launchContext,
        commandId: command.name,
        extensionId: extensionId,
      });
    }
  }

  return { executeCommand };
}
