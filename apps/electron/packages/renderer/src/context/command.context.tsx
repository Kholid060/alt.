import AMessagePort from '#common/utils/AMessagePort';
import { RefObject, createContext, useRef } from 'react';

export interface CommandContextState {
  extMessagePort: RefObject<AMessagePort | null>;
  setExtMessageChannel(port: MessageChannel): void;
  extMessageChannel: RefObject<MessageChannel | null>;
}

export const CommandContext = createContext<CommandContextState>({
  setExtMessageChannel() {},
  extMessagePort: { current: null },
  extMessageChannel: { current: null },
});


export function CommandCtxProvider({ children }: { children: React.ReactNode }) {
  const extMessagePort = useRef<AMessagePort | null>(null);
  const extMessageChannel = useRef<MessageChannel | null>(null);

  function setExtMessageChannel(channel: MessageChannel) {
    extMessageChannel.current = channel;
    extMessagePort.current = new AMessagePort(channel.port1);
  }

  return (
    <CommandContext.Provider value={{ extMessagePort, extMessageChannel, setExtMessageChannel }}>
      {children}
    </CommandContext.Provider>
  )
}
