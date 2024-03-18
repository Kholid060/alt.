import { ExtensionData } from '#common/interface/extension.interface';
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { CommandActions } from '../interface/command.interface';

export interface CommandRouteBreadcrumb {
  path: string;
  label: string;
}

interface ExtensionCommandArgs {
  commandId: string;
  args: Record<string, unknown>;
}

export interface CommandStatusPanel {
  header: {
    icon?: string;
    title: string;
    subtitle?: string;
  } | null;
  status: {
    title: string;
    timeout?: number;
    onClose?: () => void;
    description?: string;
    type: 'loading' | 'error' | 'success';
  } | null;
}

interface CommandStoreState {
  query: string;
  actions: CommandActions[];
  extensions: ExtensionData[];
  statusPanel: CommandStatusPanel;
  commandArgs: ExtensionCommandArgs;
  breadcrumbs: CommandRouteBreadcrumb[];
}

interface CommandStoreActions {
  $reset(): void;
  setCommandArgs: (
    data: Partial<ExtensionCommandArgs>,
    replace?: boolean,
  ) => void;
  addExtension: (data: ExtensionData) => void;
  updateExtension: (id: string, data: Partial<ExtensionData>) => void;
  updateStatusPanel: <K extends keyof CommandStatusPanel>(
    key: K,
    value: CommandStatusPanel[K],
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
  breadcrumbs: [],
  statusPanel: {
    header: null,
    status: null,
  },
  commandArgs: {
    args: {},
    commandId: '',
  },
};

type CommandStore = CommandStoreState & CommandStoreActions;

export const useCommandStore = create<CommandStore>()(
  immer((set, get) => ({
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
    updateStatusPanel(key, value) {
      set((state) => {
        state.statusPanel[key] = value;
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
        };
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
