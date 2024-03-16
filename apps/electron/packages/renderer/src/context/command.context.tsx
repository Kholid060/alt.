import { RefObject, createContext, useEffect, useRef } from 'react';
import { AMessagePort } from '@repo/shared';
import { ExtensionMessagePortEvent } from '@repo/extension';
import emitter, { MittEventHandler } from '../lib/mitt';
import ExtensionWorker from '../utils/extension/ExtensionWorker';
import { useCommandStore } from '../stores/command.store';
import { useShallow } from 'zustand/react/shallow';
import preloadAPI from '../utils/preloadAPI';

export interface CommandContextState {
  setExtMessagePort(port: MessagePort | null): void;
  extMessagePort: RefObject<AMessagePort<ExtensionMessagePortEvent> | null>;
}

export const CommandContext = createContext<CommandContextState>({
  setExtMessagePort() {},
  extMessagePort: { current: null },
});

export function CommandCtxProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const extMessagePort = useRef<AMessagePort<ExtensionMessagePortEvent> | null>(
    null,
  );
  const [updateStatusPanel, setCommandStore] = useCommandStore(
    useShallow((state) => [state.updateStatusPanel, state.setState]),
  );

  function setExtMessagePort(port: MessagePort | null) {
    if (!port && extMessagePort.current) {
      extMessagePort.current.destroy();
    }

    extMessagePort.current = port ? new AMessagePort(port) : port;
  }

  useEffect(() => {
    const clearPanel = () => {
      setCommandStore('statusPanel', {
        header: null,
        status: null,
      });
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
          setCommandStore('statusPanel', {
            header: null,
            status: null,
          });
        },
        onError(message) {
          if (!message) {
            clearPanel();
            return;
          }

          updateStatusPanel('status', {
            type: 'error',
            title: `Error: ${message}`,
          });
          setTimeout(clearPanel, 4000);
        },
      });
    };

    const offCommandScriptMessageEvent = preloadAPI.main.ipcMessage.on(
      'command-script:message',
      (_, detail) => {
        switch (detail.type) {
          case 'finish':
          case 'error': {
            updateStatusPanel('status', {
              title: detail.message,
              type: detail.type === 'error' ? 'error' : 'success',
            });
            setTimeout(clearPanel, 4000);
            break;
          }
        }
      },
    );
    emitter.on('execute-command', onExecuteCommand);

    return () => {
      offCommandScriptMessageEvent?.();
      emitter.off('execute-command', onExecuteCommand);
    };
  }, []);

  return (
    <CommandContext.Provider
      value={{
        extMessagePort,
        setExtMessagePort,
      }}
    >
      {children}
    </CommandContext.Provider>
  );
}
