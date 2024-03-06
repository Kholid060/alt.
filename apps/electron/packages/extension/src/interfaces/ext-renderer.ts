import type { ExtensionMessagePortEvent } from '@repo/extension/dist/interfaces/message-events';
import type { AMessagePort } from '@repo/shared';

export type ExtensionRenderer<K extends unknown[] = []> = (
  detail: {
    messagePort: AMessagePort<ExtensionMessagePortEvent>;
    commandArgs: Record<string, unknown>;
  },
  ...args: K
) => Promise<void>;
