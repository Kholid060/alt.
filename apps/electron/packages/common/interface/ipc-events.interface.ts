import type { FlatActionExtensionAPI } from '@repo/extension-core/dist/flat-extension-api';
import type ExtensionAPI from '@repo/extension-core/types/extension-api';
import type { ExtensionData } from './extension.interface';

export type IPCUserExtensionEventsMap = FlatActionExtensionAPI;

export interface IPCEventError {
  $isError: true;
  message: string;
}

export interface IPCEvents {
  'shell:open-url': (url: string) => void;
  'clipboard:copy': (content: string) => void;
  'clipboard:paste': (content: string) => void;
  'shell:open-in-folder': (path: string) => void;
  'shell:move-to-trash': (path: string) => void;
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
