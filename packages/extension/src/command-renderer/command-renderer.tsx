import React from 'react';
import { ExtensionProvider } from './context/extension.context';
import { AMessagePort } from '@repo/shared';
import { ExtensionMessagePortEvent } from '@/interfaces/message-events';
import { UiListProvider } from '@repo/ui/dist/context/list.context';
import { CommandLaunchProps } from '@/interfaces/command.interface';

export type ExtensionCommandView = (
  props: CommandLaunchProps,
) => React.ReactNode;
export type ExtensionCommandRenderer = (detail: {
  messagePort: AMessagePort<
    ExtensionMessagePortEvent & { __PLACEHOLDER__: () => void }
  >;
  commandArgs: Record<string, unknown>;
}) => React.ReactNode;

function commandRenderer(
  CommandView: ExtensionCommandView,
): ExtensionCommandRenderer {
  const MemoView = React.memo(CommandView);

  return function ExtensionRoot({ messagePort, commandArgs }) {
    return (
      <React.StrictMode>
        <UiListProvider>
          <ExtensionProvider messagePort={messagePort}>
            <MemoView args={commandArgs} />
          </ExtensionProvider>
        </UiListProvider>
      </React.StrictMode>
    );
  };
}

export default commandRenderer;
