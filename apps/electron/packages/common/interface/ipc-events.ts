import type { FlatActionExtensionAPI } from '@repo/extension-core/dist/flat-extension-api';
import type ExtensionAPI from '@repo/extension-core/types/extension-api';
import type { ExtensionData } from './extension';

export type IPCUserExtensionEventsMap = FlatActionExtensionAPI;

export interface IPCEventError {
  $isError: true;
  message: string;
}

export interface IPCEvents {
  'extension:list': () => ExtensionData[];
  'extension:init-message-port': () => MessagePort;
  'apps:get-list': () => ExtensionAPI.installedApps.AppDetail[];
  'extension:get': (
    extensionId: string,
  ) => (ExtensionData & { $key: string }) | null;
  'user-extension': <T extends keyof IPCUserExtensionEventsMap>(detail: {
    key: string;
    name: T;
    args: Parameters<IPCUserExtensionEventsMap[T]>;
  }) => Awaited<ReturnType<IPCUserExtensionEventsMap[T]>>;
}
