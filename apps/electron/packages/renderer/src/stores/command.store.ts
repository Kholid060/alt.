import { ExtensionData } from '#common/interface/extension.interface';
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { CommandActions } from '../interface/command.interface';
import createStoreSelectors from '../utils/createStoreSelector';

interface ExtensionCommandArgs {
  commandId: string;
  args: Record<string, unknown>;
}

interface CommandStoreState {
  query: string;
  actions: CommandActions[];
  extensions: ExtensionData[];
  commandArgs: ExtensionCommandArgs;
  extensionErrors: Record<string, CommandErrorOverlayData[]>;
  errorOverlay: { title: string; errors: CommandErrorOverlayData[] } | null;
}

interface CommandErrorOverlayData {
  title?: string;
  content: string;
}

interface CommandStoreActions {
  $reset(): void;
  setCommandArgs: (
    data: Partial<ExtensionCommandArgs>,
    replace?: boolean,
  ) => void;
  addExtension: (data: ExtensionData) => void;
  addExtensionError: (extId: string, error: CommandErrorOverlayData) => void;
  updateExtension: (id: string, data: Partial<ExtensionData>) => void;
  setState: <T extends keyof CommandStoreState>(
    name: T,
    value: CommandStoreState[T],
  ) => void;
  showExtensionErrorOverlay(detail: {
    title: string;
    extensionId: string;
    errors?: CommandErrorOverlayData[];
  }): void;
}

const MAX_EXTENSION_ERROR_ITEMS = 20;

const initialState: CommandStoreState = {
  query: '',
  actions: [],
  extensions: [],
  errorOverlay: null,
  extensionErrors: {},
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
          errors: [
            ...(errors ?? []),
            ...(state.extensionErrors[extensionId] ?? []),
          ],
        };
      });
    },
    addExtensionError(extId, error) {
      set((state) => {
        if (!state.extensionErrors[extId]) {
          state.extensionErrors[extId] = [];
        }
        if (state.extensionErrors[extId].length >= MAX_EXTENSION_ERROR_ITEMS) {
          state.extensionErrors[extId].pop();
        }

        state.extensionErrors[extId].unshift(error);
      });
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
    addExtension(data) {
      set((state) => {
        state.extensions.push(data);
      });
    },
    updateExtension(extId, data) {
      set((state) => {
        const index = state.extensions.findIndex(
          (extension) => extension.id === extId,
        );
        if (index === -1) return;

        delete data.id;

        state.extensions[index] = {
          ...state.extensions[index],
          ...data,
        } as ExtensionData;
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
