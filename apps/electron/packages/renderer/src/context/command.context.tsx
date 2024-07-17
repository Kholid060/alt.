import { createContext, useEffect, useRef } from 'react';
import { useCommandPanelStore } from '../stores/command-panel.store';
import preloadAPI from '../utils/preloadAPI';
import { ExtensionCommandExecutePayload } from '#packages/common/interface/extension.interface';
import { MESSAGE_PORT_CHANNEL_IDS } from '#packages/common/utils/constant/constant';
import {
  MessagePortListener,
  MessagePortRenderer,
} from '#common/utils/message-port-renderer';
import { MessagePortSharedCommandWindowEvents } from '#packages/common/interface/message-port-events.interface';
import { debugLog } from '#packages/common/utils/helper';
import { BetterMessagePortSync } from '@altdot/shared';
import {
  ExtensionMessagePortEvent,
  ExtensionMessagePortEventAsync,
} from '@altdot/extension';
import { useDialog } from '@altdot/ui';

type CommandViewMessagePort = BetterMessagePortSync<ExtensionMessagePortEvent>;
type RunnerMessagePort = MessagePortRenderer<
  ExtensionMessagePortEventAsync,
  MessagePortSharedCommandWindowEvents
>;

export interface CommandContextState {
  executeCommand(payload: ExtensionCommandExecutePayload): void;
  setCommandViewMessagePort(port: CommandViewMessagePort | null): void;
  runnerMessagePort: React.MutableRefObject<RunnerMessagePort>;
  commandViewMessagePort: React.RefObject<CommandViewMessagePort>;
}

// @ts-expect-error ...
export const CommandContext = createContext<CommandContextState>();

export function CommandCtxProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const runnerMessagePort = useRef<RunnerMessagePort>(
    new MessagePortRenderer(),
  );
  const commandViewMessagePort = useRef<CommandViewMessagePort | null>(null);

  const dialog = useDialog();

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
    const offCommandScriptMessageEvent = runnerMessagePort.current.eventSync.on(
      'command-script:message',
      (detail) => {
        const { clearAll, addStatus } = useCommandPanelStore.getState();

        switch (detail.type) {
          case 'finish':
          case 'error': {
            const isError = detail.type === 'error';
            addStatus({
              description: detail.message.slice(
                0,
                detail.message.indexOf('\n'),
              ),
              title: isError
                ? 'Error!'
                : `"${detail.commandTitle}" Script finish running`,
              type: isError ? 'error' : 'success',
              onClose() {
                clearAll();
              },
            });
            break;
          }
        }
      },
    );
    const offConfirmAlert = runnerMessagePort.current.eventAsync.on(
      'extension:show-confirm-alert',
      async ({ title, body, cancelText, okText, okVariant }) => {
        await preloadAPI.main.ipc.invoke('command-window:show');
        return dialog.confirm({
          body,
          title,
          okText,
          cancelText,
          okButtonVariant: okVariant,
        });
      },
    );

    const offSharedMessagePortListener = MessagePortListener.on(
      MESSAGE_PORT_CHANNEL_IDS.sharedWithCommand,
      ({ ports: [port] }) => {
        if (!port) return;

        debugLog('Receive MessagePort from shared process', port);
        runnerMessagePort.current.changePort(port);
      },
    );

    return () => {
      offConfirmAlert();
      offSharedMessagePortListener();
      offCommandScriptMessageEvent();
    };
  }, [dialog]);

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
