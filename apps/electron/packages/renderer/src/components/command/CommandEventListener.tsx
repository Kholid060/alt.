import { memo, useEffect } from 'react';
import preloadAPI from '/@/utils/preloadAPI';
import { useShallow } from 'zustand/react/shallow';
import emitter, { MittEventHandler } from '/@/lib/mitt';
import { useCommandPanelStore } from '/@/stores/command-panel.store';
import ExtensionWorker from '/@/utils/extension/ExtensionWorker';
import { useCommandCtx } from '/@/hooks/useCommandCtx';
import { useCommand } from '/@/hooks/useCommand';

function CommandEventListener() {
  const [clearAllStatus, addStatus, setHeader] = useCommandPanelStore(
    useShallow((state) => [
      state.clearAllStatus,
      state.addStatus,
      state.setHeader,
    ]),
  );

  const { executeCommand } = useCommand();
  const { setExtMessagePort } = useCommandCtx();

  useEffect(() => {
    const clearPanel = () => {
      setHeader(null);
      clearAllStatus();
    };

    const onExecuteCommand: MittEventHandler<'execute-command'> = async (
      payload,
    ) => {
      const { port1, port2 } = new MessageChannel();
      setExtMessagePort(port2);

      ExtensionWorker.instance.executeActionCommand({
        ...payload,
        messagePort: port1,
        onFinish() {
          clearPanel();
        },
        onError(message) {
          if (!message) {
            clearPanel();
            return;
          }

          addStatus({
            type: 'error',
            title: 'Error!',
            description: message,
            onClose() {
              clearPanel();
            },
          });
        },
      });
    };
    emitter.on('execute-command', onExecuteCommand);

    const offCommandScriptMessageEvent = preloadAPI.main.ipcMessage.on(
      'command-script:message',
      (_, detail) => {
        switch (detail.type) {
          case 'finish':
          case 'error': {
            const isError = detail.type === 'error';
            addStatus({
              description: detail.message,
              title: isError ? 'Error!' : 'Script finish running',
              type: isError ? 'error' : 'success',
              onClose() {
                clearPanel();
              },
            });
            break;
          }
        }
      },
    );
    const offCommandExecute = preloadAPI.main.ipcMessage.on(
      'command:execute',
      (_, { command, launchContext, extensionId, extensionName }) => {
        executeCommand({
          command,
          extensionId,
          launchContext,
          extensionName,
        });
      },
    );

    return () => {
      offCommandExecute?.();
      offCommandScriptMessageEvent?.();
      emitter.off('execute-command', onExecuteCommand);
    };
  }, []);

  return null;
}

export default memo(CommandEventListener);
