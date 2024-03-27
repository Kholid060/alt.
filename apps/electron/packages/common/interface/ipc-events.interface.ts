import type { FlatActionExtensionAPI } from '@repo/extension-core/dist/flat-extension-api';
import type ExtensionAPI from '@repo/extension-core/types/extension-api';
import type {
  ExtensionConfigData,
  ExtensionData,
  ExtensionDataBase,
} from './extension.interface';
import type { ExtensionCommand, ExtensionConfig } from '@repo/extension-core';
import type { CommandLaunchContext } from '@repo/extension';
import type { PartialDeep } from 'type-fest';
import type { BrowserExtensionTab } from '@repo/shared';

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

export interface IPCExtensionConfigEvents {
  'extension-config:exists': (configId: string) => boolean;
  'extension-config:get': (configId: string) => ExtensionConfigData | null;
  'extension-config:need-input': (
    extensionId: string,
    commandId: string,
  ) =>
    | { requireInput: false }
    | {
        requireInput: true;
        config: ExtensionConfig[];
        type: 'extension' | 'command';
      };
  'extension-config:update': (
    configId: string,
    data: PartialDeep<Pick<ExtensionConfigData, 'value'>>,
  ) => void;
  'extension-config:set': (
    configId: string,
    data: Omit<ExtensionConfigData, 'configId' | 'id'>,
  ) => void;
}

export interface IPCUserExtensionEvents {
  'user-extension': <T extends keyof IPCUserExtensionEventsMap>(detail: {
    key: string;
    name: T;
    commandId: string;
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
  IPCUserExtensionEvents &
  IPCExtensionConfigEvents;

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
      commandIcon: string;
      command: ExtensionCommand;
      extension: ExtensionDataBase;
      launchContext: CommandLaunchContext;
    },
  ];
  'extension-config:open': [
    {
      configId: string;
      runCommand: boolean;
      commandIcon: string;
      commandTitle: string;
      extensionName: string;
      config: ExtensionConfig[];
      launchContext: CommandLaunchContext;
    },
  ];
  'browser:tabs:active': [BrowserExtensionTab | null];
}
