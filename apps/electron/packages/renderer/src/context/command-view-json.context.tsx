import { ExtensionCommandExecutePayload } from '#packages/common/interface/extension.interface';
import { ExtensionManifest } from '@repo/extension-core';
import { createContext, useContext } from 'react';

interface CommandViewJSONState {
  extensionManifest: ExtensionManifest;
  payload: ExtensionCommandExecutePayload;
}

// @ts-expect-error ...
export const CommandViewJSONContext = createContext<CommandViewJSONState>();

export function useCommandViewJSON() {
  const data = useContext(CommandViewJSONContext);

  return data;
}

export function CommandViewJSONProvider({
  children,
  ...data
}: {
  children?: React.ReactNode;
} & CommandViewJSONState) {
  return (
    <CommandViewJSONContext.Provider value={data}>
      {children}
    </CommandViewJSONContext.Provider>
  );
}
