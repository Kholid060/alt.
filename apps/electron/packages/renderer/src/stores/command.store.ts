import { ExtensionData } from '#common/interface/extension.interface';
import { create } from 'zustand';
import { CommandActions } from '../interface/command.interface';

interface ExtensionCommandArgs {
  commandId: string;
  args: Record<string, unknown>;
}

interface CommandStoreState {
  query: string;
  actions: CommandActions[];
  extensions: ExtensionData[];
  commandArgs: ExtensionCommandArgs;
}

interface CommandStoreActions {
  $reset(): void;
  setCommandArgs: (
    data: Partial<ExtensionCommandArgs>,
    replace?: boolean,
  ) => void;
  setState: <T extends keyof CommandStoreState>(
    name: T,
    value: CommandStoreState[T],
  ) => void;
}

const initialState: CommandStoreState = {
  query: '',
  actions: [],
  extensions: [],
  commandArgs: {
    args: {},
    commandId: '',
  },
};

type CommandStore = CommandStoreState & CommandStoreActions;

export const useCommandStore = create<CommandStore>((set, get) => ({
  ...initialState,
  setCommandArgs(data, replace) {
    if (replace) {
      const commandArgs: ExtensionCommandArgs = {
        args: data.args ?? {},
        commandId: data.commandId ?? '',
      };
      set({ commandArgs });

      return;
    }

    const currentVal = get().commandArgs;
    set({
      commandArgs: {
        ...currentVal,
        ...data,
        args: { ...currentVal.args, ...(data?.args ?? {}) },
      },
    });
  },
  setState(name, value) {
    set({ [name]: value });
  },
  $reset() {
    set(initialState);
  },
}));
