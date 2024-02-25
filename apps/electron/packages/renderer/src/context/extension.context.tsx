import AMessagePort from '#common/utils/AMessagePort';
import { UiCommand, UiCommandInput } from '@repo/ui';
import { createContext, forwardRef, useEffect, useRef } from 'react';
import { ExtensionStore, createExtensionStore } from '../stores/extension.store';
import { useStore } from 'zustand';
import { MessagePortCallback } from '#common/interface/message-port-events';
import { useExtensionContext } from '../hooks/useExtensionCtx';

export const ExtensionContext = createContext<ExtensionStore | null>(null)

const CommandInput = forwardRef<HTMLInputElement>((_, ref) => {
  const query = useExtensionContext((state) => state.query);

  return (
    <UiCommandInput ref={ref} value={query} rootClass="hidden" style={{ display: 'none' }} />
  );
});

export function ExtensionStateProvider(
  { children, messagePort, value }:
  { children: React.ReactNode, value?: string; messagePort: AMessagePort }
) {
  const commandRef = useRef<HTMLDivElement>(null);
  const extStoreRef = useRef(createExtensionStore({ query: value }));

  const updateQuery = useStore(extStoreRef.current, (state) => state.setQuery);

  useEffect(() => {
    const onQueryChange: MessagePortCallback<'extension:query-change'> = (newQuery) => {
      updateQuery(newQuery);
    }
    const onParentKeydown: MessagePortCallback<'extension:keydown-event'> = (event) => {
      commandRef.current?.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, ...event }));
    }

    messagePort?.addListener('extension:query-change', onQueryChange);
    messagePort?.addListener('extension:keydown-event', onParentKeydown);

    return () => {
      messagePort?.removeListener('extension:query-change', onQueryChange);
      messagePort?.removeListener('extension:keydown-event', onParentKeydown);
    }
  }, [messagePort]);

  return (
    <ExtensionContext.Provider value={extStoreRef.current}>
      <UiCommand ref={commandRef}>
        <CommandInput />
        {children}
      </UiCommand>
    </ExtensionContext.Provider>
  )
}
