import { ExtensionCommand } from '@repo/extension-core';
import { getCommandIcon } from '../utils/helper';
import { useCommandPanelStore } from '../stores/command-panel.store';
import emitter from '../lib/mitt';
import preloadAPI from '../utils/preloadAPI';
import { useCommandNavigate } from './useCommandRoute';

export function useCommand() {
  const setPanelHeader = useCommandPanelStore.use.setHeader();
  const addPanelStatus = useCommandPanelStore.use.addStatus();
  const removePanelStatus = useCommandPanelStore.use.removeStatus();

  const navigate = useCommandNavigate();

  function executeCommand({
    args,
    command,
    extensionId,
    extensionName,
  }: {
    command: ExtensionCommand;
    extensionId: string;
    extensionName: string;
    args: Record<string, unknown>;
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
        data: args,
      });
    } else if (command.type === 'script') {
      preloadAPI.main
        .invokeIpcMessage('extension:run-script-command', {
          args,
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
        args,
        commandId: command.name,
        extensionId: extensionId,
      });
    }
  }

  return { executeCommand };
}
