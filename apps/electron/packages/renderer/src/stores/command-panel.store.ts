import { create } from 'zustand';
import createStoreSelectors from '../utils/createStoreSelector';
import { immer } from 'zustand/middleware/immer';
import { nanoid } from 'nanoid/non-secure';

export interface CommandPanelStatus {
  id: string;
  title: string;
  name?: string;
  timeout?: number;
  onClose?: () => void;
  description?: string;
  type: 'loading' | 'error' | 'success';
}

export interface CommandPanelHeader {
  icon?: string;
  title: string;
  subtitle?: string;
}

export interface CommandPanelStoreState {
  status: CommandPanelStatus[];
  header: CommandPanelHeader | null;
}

export interface CommandPanelStoreActions {
  clearAll(): void;
  clearAllStatus(): void;
  removeStatus(statusIdOrName: string): void;
  setHeader(header: CommandPanelHeader | null): void;
  addStatus(status: Omit<CommandPanelStatus, 'id'>): string;
}

const initialState: CommandPanelStoreState = {
  status: [],
  header: null,
};

const DEFAULT_TIMEOUT_MS = 3000;

const commandPanelStatusTimeouts: Map<
  string,
  ReturnType<typeof setTimeout>
> = new Map();

const commandPanelStore = create<
  CommandPanelStoreState & CommandPanelStoreActions
>()(
  immer((set, get) => ({
    ...initialState,
    addStatus(status) {
      const statusId = nanoid(5);

      set((state) => {
        state.status.push({ id: statusId, ...status });
        return state;
      });

      const timeoutMs = status.timeout ?? DEFAULT_TIMEOUT_MS;
      if (timeoutMs > 0) {
        const timeout = setTimeout(() => {
          status?.onClose?.();

          set((state) => {
            const statusIndex = state.status.findIndex(
              (item) => item.id === statusId,
            );
            if (statusIndex === -1) return;

            state.status.splice(statusIndex, 1);
          });
          commandPanelStatusTimeouts.delete(statusId);
        }, timeoutMs);

        commandPanelStatusTimeouts.set(statusId, timeout);
      }

      return statusId;
    },
    clearAllStatus() {
      set({ status: [] });
      commandPanelStatusTimeouts.forEach((timeout) => {
        clearTimeout(timeout);
      });
      commandPanelStatusTimeouts.clear();
    },
    clearAll() {
      get().clearAllStatus();
      set({ header: null });
    },
    removeStatus(statusIdOrName) {
      set((state) => {
        const statusIds: string[] = [];
        state.status = state.status.filter((status) => {
          const isMatch =
            status.id !== statusIdOrName || status.name !== statusIdOrName;
          if (!isMatch) return true;

          statusIds.push(status.id);

          return false;
        });

        statusIds.forEach((id) => {
          const timeout = commandPanelStatusTimeouts.get(id);
          if (timeout) clearTimeout(timeout);

          commandPanelStatusTimeouts.delete(id);
        });
      });
    },
    setHeader(header) {
      set({ header });
    },
  })),
);

export const useCommandPanelStore = createStoreSelectors(commandPanelStore);
