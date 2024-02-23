import { useContext } from 'react';
import { useStore } from 'zustand';
import { ExtensionContext } from '../context/extension.context';
import { ExtensionStoreState } from '../stores/extension.store';

export function useExtensionContext<T>(selector: (state: ExtensionStoreState) => T): T {
  const store = useContext(ExtensionContext)
  if (!store) throw new Error('Missing BearContext.Provider in the tree')

  return useStore(store, selector);
}
