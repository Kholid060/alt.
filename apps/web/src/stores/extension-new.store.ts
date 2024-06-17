import { ExtensionManifest } from '@alt-dot/extension-core';
import { StoreApi, createStore } from 'zustand';

export interface ExtensionNewRepo {
  url: string;
  name: string;
  owner: string;
  branch: string;
}

export interface ExtensionNewStoreState {
  banners: string[];
  categories: string[];
  baseAssetURL: string;
  repo: ExtensionNewRepo;
  manifest: ExtensionManifest;
}

export interface ExtensionNewStoreActions {
  updateState<T extends keyof ExtensionNewStoreState>(
    key: T,
    value: ExtensionNewStoreState[T],
  ): void;
  $reset(): void;
  getAssetURL(path: string): string;
}

export type ExtensionNewStoreValue = ExtensionNewStoreState &
  ExtensionNewStoreActions;

export type ExtensionNewStore = StoreApi<ExtensionNewStoreValue>;

export type ExtensionNewStoreProps = Pick<
  ExtensionNewStoreState,
  'repo' | 'manifest' | 'baseAssetURL'
>;

export const createExtensionNewStore = (props: ExtensionNewStoreProps) => {
  return createStore<ExtensionNewStoreValue>((set, get) => ({
    ...props,
    banners: [],
    categories: [],
    getAssetURL(path) {
      return `${get().baseAssetURL}${path}`;
    },
    $reset() {
      // @ts-expect-error clear value
      set({ banners: [], manifest: {}, categories: [], repo: {} });
    },
    updateState(key, value) {
      set({ [key]: value });
    },
  }));
};
