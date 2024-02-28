import { RefObject, createContext, useRef } from 'react';
import { AMessagePort } from '@repo/shared';
import { ExtensionMessagePortEvent } from '@repo/extension';

export interface CommandContextState {
  setExtMessageChannel(port: MessageChannel): void;
  extMessageChannel: RefObject<MessageChannel | null>;
  extMessagePort: RefObject<AMessagePort<ExtensionMessagePortEvent> | null>;
}

export const CommandContext = createContext<CommandContextState>({
  setExtMessageChannel() {},
  extMessagePort: { current: null },
  extMessageChannel: { current: null },
});

export function CommandCtxProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const extMessageChannel = useRef<MessageChannel | null>(null);
  const extMessagePort = useRef<AMessagePort<ExtensionMessagePortEvent> | null>(
    null,
  );

  function setExtMessageChannel(channel: MessageChannel) {
    extMessageChannel.current = channel;
    extMessagePort.current = new AMessagePort(channel.port1);
  }

  return (
    <CommandContext.Provider
      value={{ extMessagePort, extMessageChannel, setExtMessageChannel }}
    >
      {children}
    </CommandContext.Provider>
  );
}
