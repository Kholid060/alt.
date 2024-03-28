import type { BrowserInfo } from '../validation/browser-info.validation';

export interface BrowserExtensionTab { title: string; url: string; id: number; windowId: number }

type WSAckEventResult<T> = T | { error: boolean; errorMessage: string };

export interface ExtensionWSClientToServerEvents {
  'tabs:active': (tab: BrowserExtensionTab | null) => void;
}

export interface ExtensionBrowserTabDetail {
  tabId: number;
  windowId: number;
}

export interface ExtensionWSServerToClientEvents {
  'tabs:reload': (tab: ExtensionBrowserTabDetail, cb: (result: WSAckEventResult<void>) => void) => void;
  'tabs:click': (tab: ExtensionBrowserTabDetail, selector: string, cb: (result: WSAckEventResult<void>) => void) => void;
}

export interface ExtensionWSInterServerEvenets {};

export interface ExtensionSocketData {
  browserInfo: BrowserInfo;
}
