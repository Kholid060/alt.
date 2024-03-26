import { memo, useEffect } from 'react';
import preloadAPI from '/@/utils/preloadAPI';
import { useShallow } from 'zustand/react/shallow';
import emitter, { MittEventHandler } from '/@/lib/mitt';
import { useCommandPanelStore } from '/@/stores/command-panel.store';
import ExtensionWorker from '/@/utils/extension/ExtensionWorker';
import { useCommandCtx } from '/@/hooks/useCommandCtx';
import { useCommand } from '/@/hooks/useCommand';
import { useCommandStore } from '/@/stores/command.store';
import { useCommandNavigate } from '/@/hooks/useCommandRoute';

function CommandEventListener() {
  const [clearAllStatus, addStatus, setHeader] = useCommandPanelStore(
    useShallow((state) => [
      state.clearAllStatus,
      state.addStatus,
      state.setHeader,
    ]),
  );
  const addExtensionError = useCommandStore.use.addExtensionError();
  const setCommandStore = useCommandStore.use.setState();

  const navigate = useCommandNavigate();

  const { setExtMessagePort } = useCommandCtx();
  const { executeCommand, checkCommandConfig } = useCommand();

  useEffect(() => {
    const clearPanel = () => {
      setHeader(null);
      clearAllStatus();
    };

    const onExecuteCommand: MittEventHandler<'execute-command'> = async ({
      command,
      extension,
      commandIcon,
      launchContext,
    }) => {
      const isConfigInputted = await checkCommandConfig({
        command,
        extension,
        commandIcon,
        launchContext,
      });
      if (!isConfigInputted) return;

      const { port1, port2 } = new MessageChannel();
      setExtMessagePort(port2);

      ExtensionWorker.instance.executeActionCommand({
        messagePort: port1,
        commandId: command.name,
        extensionId: extension.id,
        launchContext: launchContext,
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
          addExtensionError(extension.id, {
            content: message,
            title: `Error in "${command.title}" command`,
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

            if (isError) {
              addExtensionError(detail.extensionId, {
                content: detail.message,
                title: `Error in "${detail.commandTitle}" command`,
              });
            }

            addStatus({
              description: detail.message.slice(
                0,
                detail.message.indexOf('\n'),
              ),
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
      async (_, { command, launchContext, commandIcon, extension }) => {
        executeCommand({
          command,
          extension,
          commandIcon,
          launchContext,
        });
      },
    );
    const offOpenExtConfig = preloadAPI.main.ipcMessage.on(
      'extension-config:open',
      (_, payload) => {
        navigate(`/configs/${payload.configId}`, {
          data: payload,
          panelHeader: {
            icon: payload.commandIcon,
            title: payload.commandTitle,
            subtitle: payload.extensionName,
          },
        });
      },
    );
    const offBrowserTabsActive = preloadAPI.main.ipcMessage.on(
      'browser:tabs:active',
      (_, browserTab) => {
        setCommandStore('activeBrowserTab', browserTab);
      },
    );

    return () => {
      offOpenExtConfig?.();
      offCommandExecute?.();
      offBrowserTabsActive?.();
      offCommandScriptMessageEvent?.();
      emitter.off('execute-command', onExecuteCommand);
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}

export default memo(CommandEventListener);
