import type { ExtensionMessagePortEvent } from '@repo/extension/dist/interfaces/message-events';
import type { AMessagePort } from '@repo/shared';

export type ExtensionRenderer<K extends unknown[] = []> = (
  messagePort: AMessagePort<ExtensionMessagePortEvent>,
  ...args: K
) => Promise<void>;
