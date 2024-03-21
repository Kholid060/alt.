import type { FlatActionExtensionAPI } from '@repo/extension-core/dist/flat-extension-api';
import type ExtensionAPI from '@repo/extension-core/types/extension-api';
import type { ExtensionData } from './extension.interface';
import type { ExtensionCommand } from '@repo/extension-core';
import type { CommandLaunchContext } from '@repo/extension';

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
  'extension:run-script-command': (detail: {
    commandId: string;
    extensionId: string;
    launchContext: CommandLaunchContext;
  }) => { success: boolean; errorMessage: string };
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
  'dialog:message-box': (
    options: Electron.MessageBoxOptions,
  ) => Electron.MessageBoxReturnValue;
}

export type IPCEvents = IPCShellEvents &
  IPCAppsEvents &
  IPCDialogEvents &
  IPCClipboardEvents &
  IPCExtensionEvents &
  IPCUserExtensionEvents;

export interface IPCSendEvents {
  'command-script:message': [
    {
      message: string;
      commandId: string;
      extensionId: string;
      commandTitle: string;
      type: 'error' | 'message' | 'start' | 'finish' | 'stderr';
    },
  ];
  'command:execute': [
    {
      extensionId: string;
      extensionName: string;
      command: ExtensionCommand;
      launchContext: CommandLaunchContext;
    },
  ];
}
