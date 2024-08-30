import { ExtensionAPI, ExtensionMessagePortEvent } from '@altdot/extension';
import { ExtensionExecutionFinishReason } from '@altdot/extension/dist/interfaces/message-events';
import { BetterMessagePortSync } from '@altdot/shared';
import { useState, useEffect } from 'react';

function ExtensionHistory({
  rootView,
  messagePort,
}: {
  rootView: React.ReactNode;
  messagePort: BetterMessagePortSync<ExtensionMessagePortEvent>;
}) {
  const [historyStack, setHistoryStack] = useState<React.ReactNode[]>(() => [
    rootView,
  ]);

  useEffect(() => {
    const navigationMethods = {
      push(view: React.ReactNode) {
        setHistoryStack((prevValue) => [...prevValue, view]);
      },
      pop({ root }: ExtensionAPI.UI.Navigation.PopOptions = {}) {
        if (root) setHistoryStack([rootView]);
        else setHistoryStack((prevValue) => prevValue.slice(0, -1));
      },
    };
    Object.defineProperty(window, '$navigation', {
      writable: false,
      enumerable: false,
      configurable: false,
      value: navigationMethods,
    });

    const offListener = messagePort.on('extension:navigation-pop', () =>
      navigationMethods.pop(),
    );

    return () => {
      offListener();
    };
  }, []);
  useEffect(() => {
    messagePort.sendMessage(
      'extension:navigation-toggle-root-lock',
      historyStack.length > 1,
    );
  }, [historyStack]);

  const lastView = historyStack.at(-1);
  if (!lastView) {
    messagePort.sendMessage(
      'extension:finish-execute',
      ExtensionExecutionFinishReason.done,
    );
    return null;
  }

  return lastView;
}

export default ExtensionHistory;
