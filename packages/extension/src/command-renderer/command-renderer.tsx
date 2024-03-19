import React from 'react';
import { ExtensionProvider } from './context/extension.context';
import { AMessagePort } from '@repo/shared';
import { ExtensionMessagePortEvent } from '@/interfaces/message-events';
import { UiListProvider } from '@repo/ui/dist/context/list.context';
import { CommandLaunchContext } from '@/interfaces/command.interface';
import { UiTooltipProvider } from '@repo/ui';

export type ExtensionCommandView = (
  props: CommandLaunchContext,
) => React.ReactNode;
export type ExtensionCommandRenderer = (detail: {
  messagePort: AMessagePort<ExtensionMessagePortEvent>;
  context: CommandLaunchContext;
}) => React.ReactNode;

function commandRenderer(
  CommandView: ExtensionCommandView,
): ExtensionCommandRenderer {
  const MemoView = React.memo(CommandView);

  return function ExtensionRoot({ messagePort, context }) {
    return (
      <React.StrictMode>
        <UiListProvider>
          <UiTooltipProvider>
            <ExtensionProvider messagePort={messagePort}>
              <MemoView {...context} />
            </ExtensionProvider>
          </UiTooltipProvider>
        </UiListProvider>
      </React.StrictMode>
    );
  };
}

export default commandRenderer;
