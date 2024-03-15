import type { FlatActionExtensionAPI } from '@repo/extension-core/dist/flat-extension-api';
import type ExtensionAPI from '@repo/extension-core/types/extension-api';
import type { ExtensionData } from './extension.interface';

export type IPCUserExtensionEventsMap = FlatActionExtensionAPI;

export interface IPCEventError {
  $isError: true;
  message: string;
}

export interface IPCShellEvents {
  'shell:open-url': (url: string) => void;
  'shell:open-in-folder': (path: string) => void;
  'shell:move-to-trash': (path: string) => void;
}

export interface IPCAppsEvents {
  'apps:get-list': () => ExtensionAPI.shell.installedApps.AppDetail[];
}

export interface IPCClipboardEvents {
  'clipboard:copy': (content: string) => void;
  'clipboard:paste': (content: string) => void;
}

export interface IPCExtensionEvents {
  'extension:list': () => ExtensionData[];
  'extension:reload': (extId: string) => ExtensionData | null;
  'extension:import': () => ExtensionData | null;
  'extension:init-message-port': () => MessagePort;
  'extension:get': (
    extensionId: string,
  ) => (ExtensionData & { $key: string }) | null;
}

export interface IPCUserExtensionEvents {
  'user-extension': <T extends keyof IPCUserExtensionEventsMap>(detail: {
    key: string;
    name: T;
    args: Parameters<IPCUserExtensionEventsMap[T]>;
  }) => Awaited<ReturnType<IPCUserExtensionEventsMap[T]>>;
}

export interface IPCDialogEvents {
  'dialog:open': (
    options: Electron.OpenDialogOptions,
  ) => Electron.OpenDialogReturnValue;
}

export type IPCEvents = IPCShellEvents &
  IPCAppsEvents &
  IPCDialogEvents &
  IPCClipboardEvents &
  IPCExtensionEvents &
  IPCUserExtensionEvents;
