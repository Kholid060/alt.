import { RefObject, createContext, useRef } from 'react';
import { AMessagePort } from '@repo/shared';
import { ExtensionMessagePortEvent } from '@repo/extension';

interface ExtensionCommandArgs {
  commandId: string;
  args: Record<string, unknown>;
}

export interface CommandContextState {
  extCommandArgs: RefObject<ExtensionCommandArgs>;
  setExtMessagePort(port: MessagePort | null): void;
  setExtCommandArgs(
    detail: Partial<ExtensionCommandArgs>,
    replace?: boolean,
  ): void;
  extMessagePort: RefObject<AMessagePort<ExtensionMessagePortEvent> | null>;
}

export const CommandContext = createContext<CommandContextState>({
  setExtMessagePort() {},
  setExtCommandArgs() {},
  extCommandArgs: { current: null },
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
  const extCommandArgs = useRef<ExtensionCommandArgs>({
    args: {},
    commandId: '',
  });

  function setExtMessagePort(port: MessagePort | null) {
    if (!port && extMessagePort.current) {
      extMessagePort.current.destroy();
    }

    extMessagePort.current = port ? new AMessagePort(port) : port;
  }
  function setExtCommandArgs(
    data: Partial<ExtensionCommandArgs>,
    replace: boolean = false,
  ) {
    if (replace) {
      extCommandArgs.current.args = data.args ?? {};
      extCommandArgs.current.commandId = data.commandId ?? '';
      return;
    }

    extCommandArgs.current = {
      ...extCommandArgs.current,
      ...data,
      args: {
        ...extCommandArgs.current.args,
        ...(data?.args ?? {}),
      },
    };
  }

  return (
    <CommandContext.Provider
      value={{
        extCommandArgs,
        extMessagePort,
        setExtCommandArgs,
        setExtMessagePort,
      }}
    >
      {children}
    </CommandContext.Provider>
  );
}
