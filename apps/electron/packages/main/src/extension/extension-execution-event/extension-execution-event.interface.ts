import { ExtensionAPIMessagePayload } from '#packages/common/interface/extension.interface';
import { ExtensionManifest } from '@alt-dot/extension-core';

export type ExtensionExecutionEventContext = Pick<
  ExtensionAPIMessagePayload,
  'commandId' | 'browserCtx' | 'sender'
> & {
  extensionId: string;
  extension: ExtensionManifest;
};
