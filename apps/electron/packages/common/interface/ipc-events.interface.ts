import type { FlatActionExtensionAPI } from '@repo/extension-core/dist/flat-extension-api';
import type ExtensionAPI from '@repo/extension-core/types/extension-api';
import type {
  ExtensionBrowserTabContext,
  ExtensionCommandConfigValuePayload,
  ExtensionCommandExecutePayload,
  ExtensionCommandExecutePayloadWithData,
  ExtensionCommandJSONViewData,
  ExtensionCommandProcess,
  ExtensionCommandViewData,
} from './extension.interface';
import type {
  AllButLast,
  BrowserConnected,
  BrowserInfo,
  BrowserType,
  ExtensionActiveTabActionWSEvents,
  Last,
  WSAckErrorResult,
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
import type { ExtensionCredential } from '@repo/extension-core/src/client/manifest/manifest-credential';
import type { WindowNames } from './window.interface';
import type { AppSettings, AppVersions } from './app.interface';

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
  'app:get-settings': <T extends keyof AppSettings>(
    keys?: T,
  ) => T extends keyof AppSettings ? AppSettings[T] : AppSettings;
  'app:set-settings': (settings: Partial<AppSettings>) => void;
  'app:backup-data': () => boolean;
  'app:restore-data': (upsertDuplicate?: boolean) => boolean;
  'app:versions': () => AppVersions;
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
  'browser:get-focused': () => BrowserConnected[];
  'browser:get-connected-browsers': () => BrowserInfo[];
  'browser:get-active-tab': (browserId?: string) => ExtensionBrowserTabContext;
  'browser:new-tab': (
    browserId: string,
    url: string,
  ) => ExtensionBrowserTabContext;
  'browser:select-files': (detail: {
    tabId: number;
    paths: string[];
    selector: string;
    browserId: string;
  }) => void;
  'browser:actions': <
    T extends keyof ExtensionActiveTabActionWSEvents,
    P extends Parameters<ExtensionActiveTabActionWSEvents[T]>,
  >({
    args,
    name,
    timeout,
    browserId,
  }: {
    name: T;
    timeout?: number;
    browserId: string;
    args: AllButLast<P>;
  }) => Exclude<Parameters<Last<P>>[0], WSAckErrorResult>;
}

export interface IPCOAuthEvents {
  'oauth:connect-account': (credentalId: string) => void;
}

export interface IPCExtensionEvents {
  'extension:is-config-inputted': (
    extensionId: string,
    commandId?: string,
  ) => ExtensionCommandConfigValuePayload;
  'extension:delete': (extId: string) => void;
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
  'extension:stop-running-command': (runnerId: string) => void;
  'extension:list-running-commands': () => ExtensionCommandProcess[];
}

export interface IPCWorkflowEvents {
  'workflow:export': (workflowId: string) => void;
  'workflow:import': (filePaths?: string[]) => void;
  'workflow:stop-running': (runnerId: string) => void;
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

export interface IPCDatabaseEvents extends DatabaseEvents {
  'database:query': <T extends keyof DatabaseEvents>(
    name: T,
    ...args: Parameters<DatabaseEvents[T]>
  ) => ReturnType<DatabaseEvents[T]>;
}

export type IPCEvents = IPCShellEvents &
  IPCAppEvents &
  IPCAppsEvents &
  IPCOAuthEvents &
  IPCDialogEvents &
  IPCCryptoEvents &
  IPCWindowEvents &
  IPCScreenEvents &
  IPCBrowserEvents &
  IPCDatabaseEvents &
  IPCWorkflowEvents &
  IPCClipboardEvents &
  IPCExtensionEvents &
  IPCUserExtensionEvents;

export interface IPCSendEventMainToRenderer {
  'extension:running-commands-change': [items: ExtensionCommandProcess[]];
  'shared-window:stop-execute-command': [runnerId: string];
  'shared-window:stop-execute-workflow': [runnerId: string];
  'window:visibility-change': [isHidden: boolean];
  'app:update-route': [path: string, routeData?: unknown];
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
  'extension:command-exec-change': [
    type: 'finish' | 'start',
    detail: ExtensionCommandProcess,
    data: ExtensionAPI.runtime.command.LaunchResult,
  ];
  'window:destroy': [name: WindowNames];
  'workflow:running-change': [
    type: 'running' | 'finish',
    detail: { workflowId: string; runnerId: string },
  ];
  'app:show-notification': [
    options: ExtensionAPI.notifications.NotificationOptions,
  ];
}

export interface IPCSendEventRendererToRenderer {
  'dashboard-window:open': [path?: string];
  'data:changes': [type: 'extension' | 'command'];
  'command-window:input-config': [
    detail: {
      commandId: string;
      extensionId: string;
      type: 'extension' | 'command';
      executeCommandPayload?: ExtensionCommandExecutePayload;
    },
  ];
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

export type IPCRendererInvokeEvent = IPCInvokeEventMainToRenderer & {
  'command-window:show-oauth-overlay': (
    credential: ExtensionCredential,
    detail: {
      commandId: string;
      hasValue: boolean;
      extensionId: string;
      extensionTitle: string;
      credentialName: string;
    },
  ) => Promise<boolean>;
};
