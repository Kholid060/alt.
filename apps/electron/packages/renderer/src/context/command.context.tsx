import { RefObject, createContext, useEffect, useRef } from 'react';
import { useCommandPanelStore } from '../stores/command-panel.store';
import preloadAPI from '../utils/preloadAPI';
import { useCommandStore } from '../stores/command.store';
import { ExtensionCommandExecutePayload } from '#packages/common/interface/extension.interface';
import { MESSAGE_PORT_CHANNEL_IDS } from '#packages/common/utils/constant/constant';
import {
  MessagePortListener,
  MessagePortRenderer,
} from '#common/utils/message-port-renderer';
import { MessagePortSharedCommandWindowEvents } from '#packages/common/interface/message-port-events.interface';
import { debugLog } from '#packages/common/utils/helper';

export interface CommandContextState {
  executeCommand(payload: ExtensionCommandExecutePayload): void;
  runnerMessagePort: RefObject<
    MessagePortRenderer<MessagePortSharedCommandWindowEvents>
  >;
}

export const CommandContext = createContext<CommandContextState>({
  executeCommand() {},
  runnerMessagePort: { current: null },
});

export function CommandCtxProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const clearAllPanel = useCommandPanelStore.use.clearAll();
  const addPanelStatus = useCommandPanelStore.use.addStatus();

  const setCommandStore = useCommandStore.use.setState();
  const addExtensionError = useCommandStore.use.addExtensionError();

  const runnerMessagePort = useRef<
    MessagePortRenderer<MessagePortSharedCommandWindowEvents>
  >(new MessagePortRenderer());

  async function executeCommand(payload: ExtensionCommandExecutePayload) {
    preloadAPI.main.ipc
      .invoke('extension:execute-command', payload)
      .catch(console.error);
  }

  useEffect(() => {
    const offCommandScriptMessageEvent = preloadAPI.main.ipc.on(
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

            addPanelStatus({
              description: detail.message.slice(
                0,
                detail.message.indexOf('\n'),
              ),
              title: isError ? 'Error!' : 'Script finish running',
              type: isError ? 'error' : 'success',
              onClose() {
                clearAllPanel();
              },
            });
            break;
          }
        }
      },
    );
    const offBrowserTabsActive = preloadAPI.main.ipc.on(
      'browser:tabs:active',
      (_, browserTab) => {
        setCommandStore('activeBrowserTab', browserTab);
      },
    );

    const offSharedMessagePortListener = MessagePortListener.on(
      MESSAGE_PORT_CHANNEL_IDS.sharedWithCommand,
      ({ ports: [port] }) => {
        debugLog('Receive MessagePort from shared process');
        if (!port) return;

        runnerMessagePort.current.changePort(port);
      },
    );

    return () => {
      offBrowserTabsActive();
      offSharedMessagePortListener();
      offCommandScriptMessageEvent();
    };
  }, []);

  return (
    <CommandContext.Provider
      value={{
        executeCommand,
        runnerMessagePort,
      }}
    >
      {children}
    </CommandContext.Provider>
  );
}
