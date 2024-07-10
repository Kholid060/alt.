import { ExtensionAPIMessagePayload } from '#packages/common/interface/extension.interface';
import { IPCUserExtensionEventsMap } from '#packages/common/interface/ipc-events.interface';
import { ExtensionManifest } from '@altdot/extension';

export type ExtensionExecutionEventContext = Pick<
  ExtensionAPIMessagePayload,
  'commandId' | 'browserCtx' | 'sender'
> & {
  extensionId: string;
  extension: ExtensionManifest;
};

export type ExtensionExecutionEventReturn<
  T extends keyof IPCUserExtensionEventsMap,
> = ReturnType<IPCUserExtensionEventsMap[T]>;
