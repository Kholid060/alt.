import type { CommandLaunchContext } from '@repo/extension';
import type { ExtensionMessagePortEvent } from '@repo/extension/dist/interfaces/message-events';
import type { BetterMessagePortSync } from '@repo/shared';

export type ExtensionRenderer<K extends unknown[] = []> = (
  detail: {
    launchContext: CommandLaunchContext;
    messagePort: BetterMessagePortSync<ExtensionMessagePortEvent>;
  },
  ...args: K
) => Promise<void>;
