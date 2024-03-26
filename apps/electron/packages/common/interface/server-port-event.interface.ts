import type { ExtensionWSClientToServerEvents } from '@repo/shared';

export interface ServerPortEvent
  extends Pick<ExtensionWSClientToServerEvents, 'tabs:active'> {}
