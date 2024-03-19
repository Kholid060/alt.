import type { CommandLaunchContext } from '@repo/extension';
import type { ExtensionMessagePortEvent } from '@repo/extension/dist/interfaces/message-events';
import type { AMessagePort } from '@repo/shared';

export type ExtensionRenderer<K extends unknown[] = []> = (
  detail: {
    launchContext: CommandLaunchContext;
    messagePort: AMessagePort<ExtensionMessagePortEvent>;
  },
  ...args: K
) => Promise<void>;
