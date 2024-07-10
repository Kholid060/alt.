import { useUiListStore } from '@altdot/ui/dist/context/list.context';
import { BetterMessagePortSync } from '@altdot/shared';
import { createContext, useEffect, useState } from 'react';
import {
  ExtensionMessagePortCallback,
  ExtensionMessagePortEvent,
} from '../../../interfaces/message-events';

interface ExtensionContextState {
  query: string;
}

export const ExtensionContext = createContext<ExtensionContextState>({
  query: '',
});

export function ExtensionProvider({
  children,
  messagePort,
  value,
}: {
  children: React.ReactNode;
  value?: string;
  messagePort: BetterMessagePortSync<ExtensionMessagePortEvent>;
}) {
  const listStore = useUiListStore();

  const [query, setQuery] = useState(() => value ?? '');

  useEffect(() => {
    const onQueryChange: ExtensionMessagePortCallback<
      'extension:query-change'
    > = (newQuery) => {
      setQuery(newQuery);
      listStore.setState('search', newQuery);
    };
    const onParentKeydown: ExtensionMessagePortCallback<
      'extension:keydown-event'
    > = (event) => {
      listStore.listControllerKeyBind(
        new KeyboardEvent('keydown', { bubbles: true, ...event }),
      );
    };

    messagePort.on('extension:query-change', onQueryChange);
    messagePort.on('extension:keydown-event', onParentKeydown);

    return () => {
      messagePort.on('extension:query-change', onQueryChange);
      messagePort.on('extension:keydown-event', onParentKeydown);
    };
  }, [messagePort]);

  return (
    <ExtensionContext.Provider value={{ query }}>
      {children}
    </ExtensionContext.Provider>
  );
}
