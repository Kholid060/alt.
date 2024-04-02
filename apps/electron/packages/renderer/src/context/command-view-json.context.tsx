import { ExtensionDataValid } from '#common/interface/extension.interface';
import { createContext, useContext } from 'react';

interface CommandViewJSONState {
  commandId: string;
  extension: (ExtensionDataValid & { $key: string }) | null;
}

export const CommandViewJSONContext = createContext<CommandViewJSONState>({
  commandId: '',
  extension: null,
});

export function useCommandViewJSON() {
  const data = useContext(CommandViewJSONContext);

  return data;
}

export function CommandViewJSONProvider({
  children,
  extension,
  commandId,
}: {
  children?: React.ReactNode;
  extension: CommandViewJSONState['extension'];
  commandId: CommandViewJSONState['commandId'];
}) {
  return (
    <CommandViewJSONContext.Provider value={{ extension, commandId }}>
      {children}
    </CommandViewJSONContext.Provider>
  );
}
