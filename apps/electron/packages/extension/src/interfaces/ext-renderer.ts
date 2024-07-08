import type { CommandLaunchContext } from '@altdot/extension';
import type { ExtensionMessagePortEvent } from '@altdot/extension/dist/interfaces/message-events';
import type { BetterMessagePortSync } from '@altdot/shared';

export type ExtensionRenderer<K extends unknown[] = []> = (
  detail: {
    launchContext: CommandLaunchContext;
    messagePort: BetterMessagePortSync<ExtensionMessagePortEvent>;
  },
  ...args: K
) => Promise<void>;
