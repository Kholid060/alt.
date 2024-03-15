import { RefObject, createContext, useEffect, useRef } from 'react';
import { AMessagePort } from '@repo/shared';
import { ExtensionMessagePortEvent } from '@repo/extension';
import emitter, { MittEventHandler } from '../lib/mitt';
import ExtensionWorker from '../utils/extension/ExtensionWorker';

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

  function setExtMessagePort(port: MessagePort | null) {
    if (!port && extMessagePort.current) {
      extMessagePort.current.destroy();
    }

    extMessagePort.current = port ? new AMessagePort(port) : port;
  }

  useEffect(() => {
    const onExecuteCommand: MittEventHandler<'execute-command'> = async (
      payload,
    ) => {
      const { port1, port2 } = new MessageChannel();
      setExtMessagePort(port2);

      ExtensionWorker.instance.executeActionCommand({
        ...payload,
        messagePort: port1,
      });
    };

    emitter.on('execute-command', onExecuteCommand);

    return () => {
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
