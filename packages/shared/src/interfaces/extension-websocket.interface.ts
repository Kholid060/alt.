import type { BrowserInfo } from '../validation/browser-info.validation';

export interface BrowserExtensionTab { title: string; url: string; id: number; windowId: number }

type WSAckEventResult<T> = T | { error: boolean; errorMessage: string };

export interface ExtensionWSClientToServerEvents {
  'tabs:active': (tab: BrowserExtensionTab | null) => void;
}

export interface ExtensionWSServerToClientEvents {
  'tabs:reload': (tab: { tabId: number; windowId: number }, cb: (result: WSAckEventResult<void>) => void) => void;
}

export interface ExtensionWSInterServerEvenets {};

export interface ExtensionSocketData {
  browserInfo: BrowserInfo;
}
