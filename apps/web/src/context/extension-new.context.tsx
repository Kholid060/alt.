import {
  ExtensionNewStore,
  ExtensionNewStoreProps,
  createExtensionNewStore,
} from '@/stores/extension-new.store';
import { createContext, useRef } from 'react';

export const ExtensionNewContext = createContext<ExtensionNewStore | null>(
  null,
);

export function ExtensionNewProvider({
  children,
  ...props
}: ExtensionNewStoreProps & { children?: React.ReactNode }) {
  const storeRef = useRef<ExtensionNewStore>();
  if (!storeRef.current) {
    storeRef.current = createExtensionNewStore(props);
  }

  return (
    <ExtensionNewContext.Provider value={storeRef.current}>
      {children}
    </ExtensionNewContext.Provider>
  );
}
