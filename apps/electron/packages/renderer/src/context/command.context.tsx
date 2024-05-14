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
import { BetterMessagePortSync } from '@repo/shared';
import { ExtensionMessagePortEvent } from '@repo/extension';

type CommandViewMessagePort = BetterMessagePortSync<ExtensionMessagePortEvent>;

export interface CommandContextState {
  executeCommand(payload: ExtensionCommandExecutePayload): void;
  setCommandViewMessagePort(port: CommandViewMessagePort | null): void;
  runnerMessagePort: RefObject<
    MessagePortRenderer<MessagePortSharedCommandWindowEvents>
  >;
  commandViewMessagePort: RefObject<CommandViewMessagePort | null>;
}

export const CommandContext = createContext<CommandContextState>({
  executeCommand() {},
  setCommandViewMessagePort() {},
  runnerMessagePort: { current: null },
  commandViewMessagePort: { current: null },
});

export function CommandCtxProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const clearAllPanel = useCommandPanelStore.use.clearAll();
  const addPanelStatus = useCommandPanelStore.use.addStatus();

  const setCommandStoreState = useCommandStore.use.setState();
  const addExtensionError = useCommandStore.use.addExtensionError();

  const runnerMessagePort = useRef<
    MessagePortRenderer<MessagePortSharedCommandWindowEvents>
  >(new MessagePortRenderer());
  const commandViewMessagePort = useRef<CommandViewMessagePort | null>(null);

  async function executeCommand(payload: ExtensionCommandExecutePayload) {
    preloadAPI.main.ipc
      .invoke('extension:execute-command', payload)
      .catch(console.error);
  }
  function setCommandViewMessagePort(port: CommandViewMessagePort | null) {
    if (commandViewMessagePort.current) {
      commandViewMessagePort.current.destroy();
    }

    commandViewMessagePort.current = port;
  }

  useEffect(() => {
    const offCommandScriptMessageEvent = runnerMessagePort.current.event.on(
      'command-script:message',
      (detail) => {
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
        setCommandStoreState('activeBrowserTab', browserTab);
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
        commandViewMessagePort,
        setCommandViewMessagePort,
      }}
    >
      {children}
    </CommandContext.Provider>
  );
}
