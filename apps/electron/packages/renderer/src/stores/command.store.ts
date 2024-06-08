import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import createStoreSelectors from '../utils/createStoreSelector';
import { ExtensionBrowserTabContext } from '#packages/common/interface/extension.interface';
import { DatabaseExtensionErrorsListItem } from '#packages/main/src/interface/database.interface';

interface ExtensionCommandArgs {
  commandId: string;
  args: Record<string, unknown>;
}

export interface CommandErrorOverlay {
  title: string;
  extensionId: string;
  errors: DatabaseExtensionErrorsListItem[];
}

interface CommandStoreState {
  query: string;
  isWindowHidden: boolean;
  commandAliases: Set<string>;
  commandArgs: ExtensionCommandArgs;
  errorOverlay: CommandErrorOverlay | null;
  activeBrowserTab: ExtensionBrowserTabContext | null;
}

interface CommandStoreActions {
  $reset(): void;
  setCommandAliases(aliases: Set<string>): void;
  setCommandArgs: (
    data: Partial<ExtensionCommandArgs>,
    replace?: boolean,
  ) => void;
  setState: <T extends keyof CommandStoreState>(
    name: T,
    value: CommandStoreState[T],
  ) => void;
  showExtensionErrorOverlay(detail: CommandErrorOverlay): void;
}

const initialState: CommandStoreState = {
  query: '',
  errorOverlay: null,
  isWindowHidden: true,
  activeBrowserTab: null,
  commandAliases: new Set(),
  commandArgs: {
    args: {},
    commandId: '',
  },
};

type CommandStore = CommandStoreState & CommandStoreActions;

const commandStore = create<CommandStore>()(
  immer((set, get) => ({
    ...initialState,
    showExtensionErrorOverlay({ extensionId, title, errors }) {
      set((state) => {
        state.errorOverlay = {
          title,
          errors,
          extensionId,
        };
      });
    },
    setCommandAliases(aliases) {
      set({ commandAliases: aliases });
    },
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
  })),
);

export const useCommandStore = createStoreSelectors(commandStore);
