import type { FlatActionExtensionAPI } from '@altdot/extension/dist/flat-extension-api';
import type { ExtensionAPI } from '@altdot/extension';
import type {
  ExtensionBrowserTabContext,
  ExtensionNeedConfigInput,
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
  BrowserSelectFileOptions,
  BrowserType,
  ExtensionActiveTabActionWSEvents,
  ExtensionBrowserElementSelector,
  ExtensionBrowserTabDetail,
  Last,
  WSAckCallback,
  WSAckErrorResult,
} from '@altdot/shared';
import type { DatabaseEvents } from '../../main/src/interface/database.interface';
import type {
  WorkflowEmitEvents,
  WorkflowRunPayload,
} from './workflow.interface';
import type Electron from 'electron';
import type { MessagePortChannelIds } from './message-port-events.interface';
import type { WorkflowRunnerRunPayload } from './workflow-runner.interace';
import type { WindowNames } from './window.interface';
import type {
  AppMessagePortBridgeOptions,
  AppSettings,
  AppVersions,
} from './app.interface';
import type {
  AppCryptoCreateHashAlgorithm,
  AppCryptoCreateHashOptions,
} from '../../main/src/app/app-crypto/app-crypto.interface';
import { ExtensionWithCommandsModel } from '../../main/src/extension/extension.interface';
import {
  WorkflowApiWithExtensions,
  WorkflowUpdatePayload,
} from '../../main/src/workflow/workflow.interface';
import { SelectExtension } from '../../main/src/db/schema/extension.schema';
import { WorkflowHistoryLogItem } from '../../main/src/workflow/workflow-history/workflow-history.interface';

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

export interface IPCUserExtensionBrowserAPI
  extends Omit<ExtensionActiveTabActionWSEvents, 'tabs:select-file'> {
  'tabs:select-file': (
    tab: ExtensionBrowserTabDetail,
    selector: ExtensionBrowserElementSelector,
    files: (string | BrowserSelectFileOptions)[],
    cb: WSAckCallback<void>,
  ) => void;
}
export interface IPCUserExtensionCustomEventsMap {
  'browser.tabs.#actions': <
    T extends keyof Omit<ExtensionActiveTabActionWSEvents, 'tabs:select-file'>,
    P extends Parameters<IPCUserExtensionBrowserAPI[T]>,
  >(event: {
    name: T;
    timeout?: number;
    browserId: string;
    args: AllButLast<P>;
  }) => Promise<Exclude<Parameters<Last<P>>[0], WSAckErrorResult>>;
  'browser.tabs.selectFiles': (event: {
    timeout?: number;
    browserId: string;
    tab: ExtensionBrowserTabDetail;
    selector: ExtensionBrowserElementSelector;
    files: (string | BrowserSelectFileOptions)[];
  }) => ReturnType<ExtensionAPI.Browser.Tabs.Tab['selectFile']>;
  'oAuth.startAuth': (
    provider: ExtensionAPI.OAuth.OAuthProvider,
  ) => Promise<ExtensionAPI.OAuth.OAuthPKCERequest>;
  'oAuth.getToken': (
    provider: ExtensionAPI.OAuth.OAuthProvider,
  ) => Promise<ExtensionAPI.OAuth.OAuthTokenStorageValue | null>;
  'oAuth.removeToken': (
    provider: ExtensionAPI.OAuth.OAuthProvider,
  ) => Promise<void>;
  'oAuth.setToken': (
    provider: ExtensionAPI.OAuth.OAuthProvider,
    token: ExtensionAPI.OAuth.OAuthToken,
  ) => Promise<void>;
}

export type IPCUserExtensionEventsMap = FlatActionExtensionAPI &
  IPCUserExtensionCustomEventsMap;

export interface IPCEventError {
  $isError: true;
  message: string;
}

export interface IPCAppEvents {
  'app:open-devtools': () => void;
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
  'installed-apps:get-browsers': () => BrowserApp[];
  'installed-apps:get-list': () => ExtensionAPI.Shell.InstalledApps.AppDetail[];
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
  ) => ExtensionNeedConfigInput;
  'extension:delete': (extId: string) => void;
  'extension:reload': (extId: string) => void;
  'extension:install': (extId: string) => ExtensionWithCommandsModel | null;
  'extension:import': (
    manifestPath: string,
  ) => ExtensionWithCommandsModel | null;
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
  'workflow:save': (workflowId: string, payload: WorkflowUpdatePayload) => void;
  'workflow:get-with-extensions': (
    workflowId: string,
  ) => WorkflowApiWithExtensions;
  'workflow-history:get-log': (runnerId: string) => WorkflowHistoryLogItem[];
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
    algorithm: AppCryptoCreateHashAlgorithm,
    data: string,
    options?: AppCryptoCreateHashOptions,
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
  'command-window:open-json-view': [
    executeCommandPayload: ExtensionCommandJSONViewData,
  ];
  'command-window:open-view': [executeCommandPayload: ExtensionCommandViewData];
  'command-window:show-oauth-overlay': [
    {
      authUrl: string;
      sessionId: string;
      provider: ExtensionAPI.OAuth.OAuthProvider;
      extension: Pick<SelectExtension, 'title' | 'icon' | 'id'>;
    },
  ];
  'command-window:oauth-success': [sessionId: string];
}

export interface IPCSendEventRendererToMain {
  'window:toggle-lock': [];
  'extension:stop-execute-command': [runnerId: string];
  'extension:command-exec-change': [
    type: 'finish' | 'start',
    detail: ExtensionCommandProcess,
    data: ExtensionAPI.Runtime.Command.LaunchResult,
  ];
  'window:destroy': [name: WindowNames];
  'workflow:running-change': [
    type: 'running' | 'finish',
    detail: { workflowId: string; runnerId: string },
  ];
  'notification:show': [
    options: ExtensionAPI.Notifications.NotificationOptions,
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
  'shared-process:workflow-events': [events: Partial<WorkflowEmitEvents>];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  'database:changes': [Record<any, any[]>];
}

export interface IPCPostEventRendererToMain {
  'extension:execution-message-port': [{ extPortId: string }];
  'extension:delete-execution-message-port': [{ extPortId: string }];
  'app:message-port-bridge': [
    { channelId: MessagePortChannelIds; options?: AppMessagePortBridgeOptions },
  ];
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

export type IPCSendPayload<T extends keyof IPCMainSendEvent> =
  IPCMainSendEvent[T];

export type IPCInvokePayload<T extends keyof IPCEvents> = Parameters<
  IPCEvents[T]
>;

export type IPCInvokeReturn<T extends keyof IPCEvents> = Promise<
  ReturnType<IPCEvents[T]>
>;
