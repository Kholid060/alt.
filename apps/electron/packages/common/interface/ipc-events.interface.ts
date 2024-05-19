import type { FlatActionExtensionAPI } from '@repo/extension-core/dist/flat-extension-api';
import type ExtensionAPI from '@repo/extension-core/types/extension-api';
import type {
  ExtensionBrowserTabContext,
  ExtensionCommandConfigValuePayload,
  ExtensionCommandExecutePayload,
  ExtensionCommandExecutePayloadWithData,
  ExtensionCommandJSONViewData,
  ExtensionCommandViewData,
} from './extension.interface';
import type {
  BrowserExtensionTab,
  BrowserInfo,
  BrowserType,
} from '@repo/shared';
import type {
  DatabaseEvents,
  DatabaseExtension,
  DatabaseWorkflowUpdatePayload,
} from '../../main/src/interface/database.interface';
import type { WorkflowRunPayload } from './workflow.interface';
import type Electron from 'electron';
import type { MessagePortChannelIds } from './message-port-events.interface';
import type { WorkflowRunnerRunPayload } from './workflow-runner.interace';

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
}

export interface IPCWindowEvents {
  'command-window:show': () => void;
  'command-window:close': () => void;
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

export interface BrowserApp {
  name: string;
  location: string;
  type: BrowserType;
}
export interface IPCAppsEvents {
  'apps:get-browsers': () => BrowserApp[];
  'apps:get-list': () => ExtensionAPI.shell.installedApps.AppDetail[];
}

export interface IPCClipboardEvents {
  'clipboard:paste': () => void;
  'clipboard:copy': (content: string) => void;
  'clipboard:has-buffer': (contentType: string) => boolean;
  'clipboard:read-buffer': (contentType: string) => string;
  'clipboard:copy-buffer': (contentType: string, content: string) => void;
}

export interface IPCBrowserEvents {
  'browser:get-active-tab': () => ExtensionBrowserTabContext;
  'browser:get-connected-browsers': () => (BrowserInfo & { active: boolean })[];
}

export interface IPCExtensionEvents {
  'extension:is-config-inputted': (
    extensionId: string,
    commandId?: string,
  ) => ExtensionCommandConfigValuePayload;
  'extension:reload': (extId: string) => void;
  'extension:import': () => DatabaseExtension | null;
  'extension:init-message-port': () => MessagePort;
  'extension:get-command-file-path': (
    extensionId: string,
    commandId: string,
  ) => string | null;
  'extension:execute-command': (
    payload: ExtensionCommandExecutePayload,
  ) => string | null;
}

export interface IPCWorkflowEvents {
  'workflow:export': (workflowId: string) => void;
  'workflow:import': (filePaths?: string[]) => void;
  'workflow:execute': (payload: WorkflowRunPayload) => string | null;
  'workflow:save': (
    workflowId: string,
    payload: DatabaseWorkflowUpdatePayload,
  ) => void;
}

export interface IPCUserExtensionEvents {
  'user-extension': <T extends keyof IPCUserExtensionEventsMap>(detail: {
    name: T;
    key: string;
    commandId: string;
    browserCtx: ExtensionBrowserTabContext;
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

export interface IPCCryptoEvents {
  'crypto:create-hash': (
    algorithm: 'sha256' | 'shake256',
    data: string,
    options?: {
      outputLength?: number;
      digest?: 'hex' | 'base64' | 'base64url';
    },
  ) => string;
}

export type IPCEvents = IPCShellEvents &
  IPCAppEvents &
  IPCAppsEvents &
  DatabaseEvents &
  IPCDialogEvents &
  IPCCryptoEvents &
  IPCWindowEvents &
  IPCScreenEvents &
  IPCBrowserEvents &
  IPCWorkflowEvents &
  IPCClipboardEvents &
  IPCExtensionEvents &
  IPCUserExtensionEvents;

export interface IPCSendEventMainToRenderer {
  'shared-window:stop-execute-command': [runnerId: string];
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
  'command-window:open-command-json-view': [
    executeCommandPayload: ExtensionCommandJSONViewData,
  ];
  'command-window:open-command-view': [
    executeCommandPayload: ExtensionCommandViewData,
  ];
}

export interface IPCSendEventRendererToMain {
  'extension:stop-execute-command': [runnerId: string];
  'window:open-command': [path?: string, routeData?: unknown];
  'app:show-notification': [
    options: ExtensionAPI.notifications.NotificationOptions,
  ];
}

export interface IPCSendEventRendererToRenderer {
  'dashboard-window:open': [path?: string];
  'data:changes': [type: 'extension' | 'command'];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  'database:changes': [Record<any, any[]>];
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
  'shared-window:execute-workflow': (
    payload: WorkflowRunnerRunPayload,
  ) => Promise<string>;
}

export type IPCMainSendEvent = IPCSendEventRendererToRenderer &
  IPCSendEventRendererToMain &
  IPCPostEventRendererToMain;

export type IPCRendererSendEvent = IPCSendEventRendererToRenderer &
  IPCSendEventMainToRenderer &
  IPCPostMessageEventMainToRenderer;

export type IPCRendererInvokeEvent = IPCInvokeEventMainToRenderer;
