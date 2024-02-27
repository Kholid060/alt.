import { createStore } from 'zustand';

export interface ExtensionStoreState {
  query: string;
}

export interface ExtensionStoreAction {
  setQuery(value: string): void;
}

export type ExtensionStore = ReturnType<typeof createExtensionStore>;

export function createExtensionStore(
  initial: Partial<Pick<ExtensionStoreState, 'query'>> = {},
) {
  const initialState: ExtensionStoreState = {
    query: '',
    ...initial,
  };

  return createStore<ExtensionStoreState & ExtensionStoreAction>((set) => ({
    ...initialState,
    setQuery(value) {
      set({ query: value });
    },
  }));
}
