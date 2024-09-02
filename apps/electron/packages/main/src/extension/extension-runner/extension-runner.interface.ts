import { ExtensionAPIMessagePayload } from '#packages/common/interface/extension.interface';
import {
  IPCUserExtensionEventsMap,
  IPCEventError,
} from '#packages/common/interface/ipc-events.interface';
import { ExtensionManifest } from '@altdot/extension';

export type ExtensionMessagePortMessageHandler = <
  T extends keyof IPCUserExtensionEventsMap,
>(
  detail: ExtensionAPIMessagePayload & {
    name: T;
    args: Parameters<IPCUserExtensionEventsMap[T]>;
  },
) => Promise<Awaited<ReturnType<IPCUserExtensionEventsMap[T]>> | IPCEventError>;

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
