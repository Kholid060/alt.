import { RefObject, createContext, useRef } from 'react';
import { AMessagePort } from '@repo/shared';
import { ExtensionMessagePortEvent } from '@repo/extension';

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

  return (
    <CommandContext.Provider
      value={{
        extMessagePort,
        setExtMessagePort: setExtMessagePort,
      }}
    >
      {children}
    </CommandContext.Provider>
  );
}
