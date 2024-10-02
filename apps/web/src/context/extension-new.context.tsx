import {
  ExtensionNewStore,
  ExtensionNewStoreProps,
  createExtensionNewStore,
} from '@/stores/extension-new.store';
import { createContext, useEffect, useRef } from 'react';

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

  useEffect(() => {
    return () => {
      storeRef.current = undefined;
    };
  }, [storeRef]);

  if (!storeRef.current) return null;

  return (
    <ExtensionNewContext.Provider value={storeRef.current}>
      {children}
    </ExtensionNewContext.Provider>
  );
}
