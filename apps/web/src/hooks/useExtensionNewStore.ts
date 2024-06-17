import { ExtensionNewContext } from '@/context/extension-new.context';
import { ExtensionNewStoreValue } from '@/stores/extension-new.store';
import { useContext } from 'react';
import { useStore } from 'zustand';

export function useExtensionNewCtx() {
  const store = useContext(ExtensionNewContext);
  if (!store) {
    throw new Error('Missing ExtensionNewContext.Provider in the tree');
  }

  return store;
}
export function useExtensionNewStore<T>(
  selector: (state: ExtensionNewStoreValue) => T,
): T {
  const store = useExtensionNewCtx();
  return useStore(store, selector);
}
