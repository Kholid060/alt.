import { createContext, useEffect, useRef } from 'react';
import { useCommandPanelStore } from '../stores/command-panel.store';
import preloadAPI from '../utils/preloadAPI';
import { ExtensionCommandExecutePayload } from '#packages/common/interface/extension.interface';
import { MessagePortSharedCommandWindowEvents } from '#packages/common/interface/message-port-events.interface';
import { debugLog } from '#packages/common/utils/helper';
import { ExtensionMessagePortEventAsync } from '@altdot/extension';
import { useDialog } from '@altdot/ui';
import {
  ExtensionRendererMessagePort,
  MessagePortListener,
} from '../utils/ExtensionRendererMessagePort';

type RunnerMessagePort = ExtensionRendererMessagePort<
  ExtensionMessagePortEventAsync,
  MessagePortSharedCommandWindowEvents
>;

export interface CommandContextState {
  executeCommand(payload: ExtensionCommandExecutePayload): void;
  setCommandViewMessagePort(port: MessagePort | null): void;
  runnerMessagePort: React.MutableRefObject<RunnerMessagePort>;
  commandViewMessagePort: React.RefObject<MessagePort>;
}

// @ts-expect-error ...
export const CommandContext = createContext<CommandContextState>();

export function CommandCtxProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const runnerMessagePort = useRef<RunnerMessagePort>(
    new ExtensionRendererMessagePort(),
  );
  const commandViewMessagePort = useRef<MessagePort | null>(null);

  const dialog = useDialog();

  async function executeCommand(payload: ExtensionCommandExecutePayload) {
    preloadAPI.main.ipc
      .invoke('extension:execute-command', payload)
      .catch(console.error);
  }
  function setCommandViewMessagePort(port: MessagePort | null) {
    if (!port) {
      runnerMessagePort.current.destroyPort('view');
      return;
    }

    runnerMessagePort.current.addPort('view', port);
    commandViewMessagePort.current = port;
  }

  useEffect(() => {
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
    const offShowToast = runnerMessagePort.current.eventSync.on(
      'extension:show-toast',
      (toastId, toast) => {
        useCommandPanelStore.getState().addStatus({
          ...toast,
          name: toastId,
        });
      },
    );
    const offHideToast = runnerMessagePort.current.eventSync.on(
      'extension:hide-toast',
      (toastId) => {
        useCommandPanelStore.getState().removeStatus(toastId);
      },
    );

    const offSharedMessagePortListener = MessagePortListener.on(
      'command-window:extension-port',
      ({ ports: [port], data }) => {
        if (!port || !data) return;

        debugLog('Receive extension MessagePort', port);
        runnerMessagePort.current.addPort(data[0], port);
      },
    );

    const offCloseMessagePort = preloadAPI.main.ipc.on(
      'command-window:close-message-port',
      (_, id) => {
        console.log('destroy', id);
        runnerMessagePort.current.destroyPort(id);
      },
    );

    return () => {
      offHideToast();
      offShowToast();
      offConfirmAlert();
      offCloseMessagePort();
      offSharedMessagePortListener();
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
