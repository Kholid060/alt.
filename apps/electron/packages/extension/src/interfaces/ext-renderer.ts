import type { CommandLaunchContext } from '@alt-dot/extension';
import type { ExtensionMessagePortEvent } from '@alt-dot/extension/dist/interfaces/message-events';
import type { BetterMessagePortSync } from '@alt-dot/shared';

export type ExtensionRenderer<K extends unknown[] = []> = (
  detail: {
    launchContext: CommandLaunchContext;
    messagePort: BetterMessagePortSync<ExtensionMessagePortEvent>;
  },
  ...args: K
) => Promise<void>;
