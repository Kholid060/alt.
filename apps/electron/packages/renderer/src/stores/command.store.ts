import { ExtensionData } from '#common/interface/extension';
import { create } from 'zustand';

export interface CommandSelectedItem {
  id: string;
  label: string;
  meta?: Record<string, string>;
  type: 'command' | 'extension' | 'keyword';
}

interface CommandStoreState {
  query: string;
  extensions: ExtensionData[];
  paths: CommandSelectedItem[];
}

interface CommandStoreActions {
  $reset(): void;
  pushPath: (item: CommandSelectedItem) => void;
  setState: <T extends keyof CommandStoreState>(
    name: T,
    value: CommandStoreState[T],
  ) => void;
}

const initialState: CommandStoreState = {
  query: '',
  paths: [],
  extensions: [],
};

type CommandStore = CommandStoreState & CommandStoreActions;

export const useCommandStore = create<CommandStore>((set, get) => ({
  ...initialState,
  setState(name, value) {
    set({ [name]: value });
  },
  pushPath(item) {
    const paths = [...get().paths, item];
    set({ paths });
  },
  $reset() {
    set(initialState);
  },
}));
