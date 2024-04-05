import { RefObject, createContext, useRef } from 'react';
import { AMessagePort } from '@repo/shared';
import { ExtensionMessagePortEvent } from '@repo/extension';
import { useCommandPanelStore } from '../stores/command-panel.store';

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
  const addStatus = useCommandPanelStore.use.addStatus();
  const removeStatus = useCommandPanelStore.use.removeStatus();

  const extMessagePort = useRef<AMessagePort<ExtensionMessagePortEvent> | null>(
    null,
  );

  function setExtMessagePort(port: MessagePort | null) {
    if (!port && extMessagePort.current) {
      extMessagePort.current.destroy();
    }

    extMessagePort.current = port ? new AMessagePort(port) : port;
    if (!extMessagePort.current) return;

    extMessagePort.current.addListener(
      'extension:show-toast',
      (toastId, options) => {
        addStatus({
          name: toastId,
          ...options,
        });
      },
    );
    extMessagePort.current.addListener('extension:hide-toast', (toastId) => {
      removeStatus(toastId);
    });
  }

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
