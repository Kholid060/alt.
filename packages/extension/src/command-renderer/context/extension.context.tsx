import { UiCommand, UiCommandInput } from '@repo/ui';
import { AMessagePort } from '@repo/shared';
import { createContext, forwardRef, useEffect, useRef, useState } from 'react';
import {
  ExtensionMessagePortCallback,
  ExtensionMessagePortEvent,
} from '@/interfaces/message-events';

interface ExtensionContextState {
  query: string;
}

export const ExtensionContext = createContext<ExtensionContextState>({
  query: '',
});

const CommandInput = forwardRef<HTMLInputElement, { value: string }>(
  ({ value }, ref) => {
    return (
      <UiCommandInput
        ref={ref}
        value={value}
        rootClass="hidden"
        style={{ display: 'none' }}
      />
    );
  },
);
CommandInput.displayName = 'CommandInput';

export function ExtensionProvider({
  children,
  messagePort,
  value,
}: {
  children: React.ReactNode;
  value?: string;
  messagePort: AMessagePort<ExtensionMessagePortEvent>;
}) {
  const commandRef = useRef<HTMLDivElement>(null);

  const [query, setQuery] = useState(() => value ?? '');

  useEffect(() => {
    const onQueryChange: ExtensionMessagePortCallback<
      'extension:query-change'
    > = (newQuery) => {
      setQuery(newQuery);
    };
    const onParentKeydown: ExtensionMessagePortCallback<
      'extension:keydown-event'
    > = (event) => {
      commandRef.current?.dispatchEvent(
        new KeyboardEvent('keydown', { bubbles: true, ...event }),
      );
    };

    messagePort?.addListener('extension:query-change', onQueryChange);
    messagePort?.addListener('extension:keydown-event', onParentKeydown);

    return () => {
      messagePort?.removeListener('extension:query-change', onQueryChange);
      messagePort?.removeListener('extension:keydown-event', onParentKeydown);
    };
  }, [messagePort]);

  return (
    <ExtensionContext.Provider value={{ query }}>
      <UiCommand ref={commandRef}>
        <CommandInput value={query} />
        {children}
      </UiCommand>
    </ExtensionContext.Provider>
  );
}
