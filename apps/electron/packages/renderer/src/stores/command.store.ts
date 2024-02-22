import { ExtensionData } from '#common/interface/extension';
import { create } from 'zustand';

interface CommandStoreState {
  query: string;
  extensions: ExtensionData[];
  paths: { id: string; label: string }[];
}

interface CommandStoreActions {
  $reset(): void;
  setState: <T extends keyof CommandStoreState>(name: T, value: CommandStoreState[T]) => void;
}

const initialState: CommandStoreState = {
  query: '',
  paths: [],
  extensions: [],
};

type CommandStore = CommandStoreState & CommandStoreActions;

export const useCommandStore = create<CommandStore>((set) => ({
  ...initialState,
  setState(name, value) {
    set({ [name]: value });
  },
  $reset() {
    set(initialState);
  },
}));

