import {
  ExtensionMessagePortEvent,
  ExtensionMessagePortCallback,
} from '@altdot/extension';
import { BetterMessagePortSync } from '@altdot/shared';
import { useUiListStore } from '@altdot/ui';
import { useEffect } from 'react';

function ExtensionEventListener({
  messagePort,
}: {
  messagePort: BetterMessagePortSync<ExtensionMessagePortEvent>;
}) {
  const listStore = useUiListStore();

  useEffect(() => {
    const onQueryChange: ExtensionMessagePortCallback<
      'extension:query-change'
    > = (newQuery) => {
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
  }, [messagePort, listStore]);

  return null;
}

export default ExtensionEventListener;
