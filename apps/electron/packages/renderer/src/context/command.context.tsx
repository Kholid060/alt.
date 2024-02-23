import AMessagePort from '#common/utils/AMessagePort';
import { RefObject, createContext, useRef } from 'react';

export interface CommandContextState {
  extMessagePort: RefObject<AMessagePort | null>;
  updateMessagePort(port: AMessagePort | null): void;
}

export const CommandContext = createContext<CommandContextState>({
  updateMessagePort() {},
  extMessagePort: { current: null },
});


export function CommandCtxProvider({ children }: { children: React.ReactNode }) {
  const extMessagePort = useRef<AMessagePort | null>(null);

  function updateMessagePort(port: AMessagePort | null) {
    extMessagePort.current = port;
  }

  return (
    <CommandContext.Provider value={{ extMessagePort, updateMessagePort }}>
      {children}
    </CommandContext.Provider>
  )
}
