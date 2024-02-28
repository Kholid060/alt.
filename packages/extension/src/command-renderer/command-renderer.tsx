import React from 'react';
import { ExtensionProvider } from './context/extension.context';
import { AMessagePort } from '@repo/shared';
import { ExtensionMessagePortEvent } from '@/interfaces/message-events';

export type ExtensionCommandView = () => React.ReactNode;
export type ExtensionCommandRenderer = (detail: {
  messagePort: MessagePort;
}) => React.ReactNode;

function commandRenderer(
  CommandView: ExtensionCommandView,
): ExtensionCommandRenderer {
  const MemoView = React.memo(CommandView);

  return function ExtensionRoot({ messagePort }) {
    const aMessagePort = new AMessagePort<ExtensionMessagePortEvent>(
      messagePort,
    );

    return (
      <React.StrictMode>
        <ExtensionProvider messagePort={aMessagePort}>
          <MemoView />
        </ExtensionProvider>
      </React.StrictMode>
    );
  };
}

export default commandRenderer;
