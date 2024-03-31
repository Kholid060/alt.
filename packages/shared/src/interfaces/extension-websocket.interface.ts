import type { BrowserInfo } from '../validation/browser-info.validation';
import { KeyboardBrowserTypeOptions } from './keyboard.interface';

export interface BrowserExtensionTab {
  title: string;
  url: string;
  id: number;
  windowId: number;
}

export interface BrowserGetTextOptions {
  onlyVisibleText: boolean;
}

export interface WSAckErrorResult {
  error: boolean;
  errorMessage: string;
}

export type WSAckCallback<T> = (result: T | WSAckErrorResult) => void;

export interface ExtensionWSClientToServerEvents {
  'tabs:active': (tab: BrowserExtensionTab | null) => void;
}

export interface ExtensionBrowserTabDetail {
  tabId: number;
  windowId: number;
}

export interface ExtensionWSServerToClientEvents {
  'tabs:reload': (
    tab: ExtensionBrowserTabDetail,
    cb: WSAckCallback<void>,
  ) => void;
  'tabs:click': (
    tab: ExtensionBrowserTabDetail,
    selector: string,
    cb: WSAckCallback<void>,
  ) => void;
  'tabs:type': (
    tab: ExtensionBrowserTabDetail,
    detail: {
      selector: string;
      text: string;
      options?: Partial<KeyboardBrowserTypeOptions>;
    },
    cb: WSAckCallback<void>,
  ) => void;
  'tabs:get-text': (
    tab: ExtensionBrowserTabDetail,
    detail: {
      selector: string;
      options?: Partial<BrowserGetTextOptions>;
    },
    cb: WSAckCallback<string>,
  ) => void;
}

export interface ExtensionWSInterServerEvenets {}

export interface ExtensionSocketData {
  browserInfo: BrowserInfo;
}
