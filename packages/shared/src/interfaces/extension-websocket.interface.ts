import type { BrowserInfo } from '../validation/browser-info.validation';
import {
  KeyboardBrowserTypeOptions,
  KeyboardModifiers,
} from './keyboard.interface';

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
  'tabs:select': (
    tab: ExtensionBrowserTabDetail,
    selector: string,
    values: string[],
    cb: WSAckCallback<string[]>,
  ) => void;
  'tabs:key-down': (
    tab: ExtensionBrowserTabDetail,
    selector: string,
    key: string,
    options: { text?: string; modifiers?: KeyboardModifiers[] },
    cb: WSAckCallback<void>,
  ) => void;
  'tabs:key-up': (
    tab: ExtensionBrowserTabDetail,
    selector: string,
    key: string,
    options: { delay?: number; modifiers?: KeyboardModifiers[] },
    cb: WSAckCallback<void>,
  ) => void;
}

export interface ExtensionWSInterServerEvenets {}

export interface ExtensionSocketData {
  browserInfo: BrowserInfo;
}
