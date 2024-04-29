import type { FlatActionExtensionAPI } from '@repo/extension-core/dist/flat-extension-api';
import type ExtensionAPI from '@repo/extension-core/types/extension-api';
import type {
  ExtensionCommandExecutePayload,
  ExtensionCommandExecutePayloadWithData,
  ExtensionJSONViewData,
} from './extension.interface';
import type { ExtensionCommand } from '@repo/extension-core';
import type { CommandLaunchContext } from '@repo/extension';
import type { BrowserExtensionTab } from '@repo/shared';
import type {
  DatabaseEvents,
  DatabaseExtension,
} from '../../main/src/interface/database.interface';
import type { WorkflowRunPayload } from './workflow.interface';
import type Electron from 'electron';
import type { MessagePortChannelIds } from './message-port-events.interface';

export interface IPCRendererInvokeEventPayload {
  name: string;
  args: unknown[];
  messageId: string;
}
export interface IPCRendererInvokeEventSuccess<T = unknown> {
  result: T;
  type: 'success';
  messageId: string;
}
export interface IPCRendererInvokeEventError {
  type: 'error';
  messageId: string;
  errorMessage: string;
}
export type IPCRendererInvokeEventType<T = unknown> =
  | IPCRendererInvokeEventSuccess<T>
  | IPCRendererInvokeEventError;

export interface IPCUserExtensionCustomEventsMap {
  'browser.activeTab.elementExists': (
    selector: string,
    multiple?: boolean,
  ) => Promise<boolean | number[]>;
}

export type IPCUserExtensionEventsMap = FlatActionExtensionAPI &
  IPCUserExtensionCustomEventsMap;

export interface IPCEventError {
  $isError: true;
  message: string;
}

export interface IPCAppEvents {
  'app:open-devtools': () => void;
  'app:toggle-lock-window': () => void;
  'app:show-command-window': () => void;
  'app:close-command-window': () => void;
}

export interface IPCScreenEvents {
  'screen:get-cursor-position': (relativeToWindow?: boolean) => {
    x: number;
    y: number;
  };
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
  'clipboard:has-buffer': (contentType: string) => boolean;
  'clipboard:read-buffer': (contentType: string) => string;
  'clipboard:copy-buffer': (contentType: string, content: string) => void;
}

export interface IPCExtensionEvents {
  'extension:run-script-command': (detail: {
    commandId: string;
    extensionId: string;
    launchContext: CommandLaunchContext;
  }) => { success: boolean; errorMessage: string };
  'extension:reload': (extId: string) => void;
  'extension:import': () => DatabaseExtension | null;
  'extension:init-message-port': () => MessagePort;
  'extension:get-command': (
    extensionId: string,
    commandId: string,
  ) => ExtensionCommand | null;
  'extension:execute-command': (
    payload: ExtensionCommandExecutePayload,
  ) => string | null;
}

export interface IPCWorkflowEvents {
  'workflow:run': (payload: WorkflowRunPayload) => string;
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
  IPCAppEvents &
  IPCAppsEvents &
  DatabaseEvents &
  IPCDialogEvents &
  IPCScreenEvents &
  IPCWorkflowEvents &
  IPCClipboardEvents &
  IPCExtensionEvents &
  IPCUserExtensionEvents;

export interface IPCSendEventMainToRenderer {
  'shared-window:stop-execute-command': [processId: string];
  'command-script:message': [
    {
      message: string;
      commandId: string;
      extensionId: string;
      commandTitle: string;
      type: 'error' | 'message' | 'start' | 'finish' | 'stderr';
    },
  ];
  'window:visibility-change': [isHidden: boolean];
  'browser:tabs:active': [BrowserExtensionTab | null];
  'app:update-route': [path: string, routeData?: unknown];
  'command-window:input-config': [
    detail: {
      commandId: string;
      extensionId: string;
      type: 'extension' | 'command';
      executeCommandPayload?: ExtensionCommandExecutePayload;
    },
  ];
  'command-window:open-json-view': [
    executeCommandPayload: ExtensionJSONViewData,
  ];
}

export interface IPCSendEventRendererToMain {
  'window:open-settings': [path?: string];
  'extension:stop-execute-command': [processId: string];
  'window:open-command': [path?: string, routeData?: unknown];
}

export interface IPCSendEventRendererToRenderer {
  'data:changes': [type: 'extension' | 'command'];
  'database:changes': [type: keyof DatabaseEvents, ...args: unknown[]];
}

export interface IPCPostEventRendererToMain {
  'message-port:shared-extension<=>main': [{ extPortId: string }];
  'message-port:delete:shared-extension<=>main': [{ extPortId: string }];
  'message-port:port-bridge': [channelId: MessagePortChannelIds];
}

export interface IPCPostMessageEventMainToRenderer {
  'message-port:created': [{ channelId: MessagePortChannelIds }];
}

interface IPCInvokeEventMainToRenderer {
  'shared-window:execute-command': (
    payload: ExtensionCommandExecutePayloadWithData,
  ) => Promise<string>;
}

export type IPCMainSendEvent = IPCSendEventRendererToRenderer &
  IPCSendEventRendererToMain &
  IPCPostEventRendererToMain;

export type IPCRendererSendEvent = IPCSendEventRendererToRenderer &
  IPCSendEventMainToRenderer &
  IPCPostMessageEventMainToRenderer;

export type IPCRendererInvokeEvent = IPCInvokeEventMainToRenderer;
