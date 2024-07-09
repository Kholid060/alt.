import React from 'react';
import { BetterMessagePortSync } from '@altdot/shared';
import { ExtensionProvider } from './context/extension.context';
import { ExtensionMessagePortEvent } from '@/interfaces/message-events';
import { UiListProvider } from '@altdot/ui/dist/context/list.context';
import { CommandLaunchContext } from '@/interfaces/command.interface';
import { UiTooltipProvider } from '@altdot/ui';

export type ExtensionCommandView = (
  props: CommandLaunchContext,
) => React.ReactNode;
export type ExtensionCommandRenderer = (detail: {
  messagePort: BetterMessagePortSync<ExtensionMessagePortEvent>;
  context: CommandLaunchContext;
}) => React.ReactNode;

function commandRenderer(
  CommandView: ExtensionCommandView,
): ExtensionCommandRenderer {
  const MemoView = React.memo(CommandView);

  return function ExtensionRoot({ messagePort, context }) {
    return (
      <UiListProvider>
        <UiTooltipProvider>
          <ExtensionProvider messagePort={messagePort}>
            <MemoView {...context} />
          </ExtensionProvider>
        </UiTooltipProvider>
      </UiListProvider>
    );
  };
}

export default commandRenderer;
