import { ExtensionCommandExecutePayload } from '#packages/common/interface/extension.interface';
import { createContext, useContext } from 'react';

interface CommandViewJSONState {
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
