import { ExtensionAPIMessagePayload } from '#packages/common/interface/extension.interface';
import { ExtensionManifest } from '@altdot/extension';

export type ExtensionExecutionEventContext = Pick<
  ExtensionAPIMessagePayload,
  'commandId' | 'browserCtx' | 'sender'
> & {
  extensionId: string;
  extension: ExtensionManifest;
};