import { ExtensionMessagePortEvents } from '#common/interface/extension.interface';
import { ExtensionMessagePortCallback } from '@altdot/extension';
import { BetterMessagePortSync } from '@altdot/shared';
import { useUiListStore, useUiList } from '@altdot/ui';
import { useEffect, useRef } from 'react';

function ExtensionEventListener({
  messagePort,
}: {
  messagePort: BetterMessagePortSync<ExtensionMessagePortEvents>;
}) {
  const listStore = useUiListStore();
  const selectedItem = useUiList((state) => state.selectedItem);

  const prevSelectedItem = useRef<string | null>(null);

  if (prevSelectedItem.current === null && selectedItem.id) {
    prevSelectedItem.current = selectedItem.id;
    messagePort.sendMessage('extension:toggle-connected-list', true);
  } else if (!selectedItem.id && prevSelectedItem.current) {
    prevSelectedItem.current = null;
    messagePort.sendMessage('extension:toggle-connected-list', false);
  }

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
      messagePort.off('extension:query-change', onQueryChange);
      messagePort.off('extension:keydown-event', onParentKeydown);
    };
  }, [messagePort, listStore]);
  useEffect(() => {
    return () => {
      messagePort.sendMessage('extension:toggle-connected-list', false);
    };
  }, []);

  return null;
}

export default ExtensionEventListener;
