import React from 'react';
import { ExtensionProvider } from './context/extension.context';
import { AMessagePort } from '@repo/shared';
import { ExtensionMessagePortEvent } from '@/interfaces/message-events';

export type ExtensionCommandView = () => React.ReactNode;
export type ExtensionCommandRenderer = (detail: {
  messagePort: AMessagePort<ExtensionMessagePortEvent>;
}) => React.ReactNode;

function commandRenderer(
  CommandView: ExtensionCommandView,
): ExtensionCommandRenderer {
  const MemoView = React.memo(CommandView);

  return function ExtensionRoot({ messagePort }) {
    return (
      <React.StrictMode>
        <ExtensionProvider messagePort={messagePort}>
          <MemoView />
        </ExtensionProvider>
      </React.StrictMode>
    );
  };
}

export default commandRenderer;
