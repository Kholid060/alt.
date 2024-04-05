import {
  KeyboardKeyUpOptions,
  KeyboardKeyDownOptions,
  KeyboardBrowserTypeOptions,
} from './keyboard.interface';

export interface BrowserExtensionTab {
  title: string;
  url: string;
  id: number;
  windowId: number;
}

export interface BrowserInfo {
  id: string;
  name: string;
  version: string;
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

export interface ExtensionBrowserElementSelector {
  selector: string;
  elementIndex?: number;
}

type ExtensionWSAckHandler<T extends unknown[] = [], R = void> = (
  tab: ExtensionBrowserTabDetail,
  ...args: [...T, cb: WSAckCallback<R>]
) => void;

type ExtensionWSAckElementHandler<
  T extends unknown[] = [],
  R = void,
> = ExtensionWSAckHandler<[selector: ExtensionBrowserElementSelector, ...T], R>;

export interface ExtensionWSServerToClientEvents {
  'tabs:reload': ExtensionWSAckHandler;
  'tabs:click': ExtensionWSAckElementHandler;
  'tabs:type': ExtensionWSAckElementHandler<
    [text: string, options: Partial<KeyboardBrowserTypeOptions>]
  >;
  'tabs:get-text': ExtensionWSAckElementHandler<
    [options: Partial<BrowserGetTextOptions>],
    string
  >;
  'tabs:select': ExtensionWSAckElementHandler<[values: string[]], string[]>;
  'tabs:key-down': ExtensionWSAckElementHandler<
    [key: string, options: KeyboardKeyDownOptions]
  >;
  'tabs:key-up': ExtensionWSAckElementHandler<
    [key: string, options: KeyboardKeyUpOptions]
  >;
  'tabs:press': ExtensionWSAckElementHandler<
    [key: string, options: KeyboardKeyDownOptions & KeyboardKeyUpOptions]
  >;
  'tabs:get-attributes': ExtensionWSAckElementHandler<
    [attrNames: string | string[] | null],
    string | null | Record<string, string>
  >;
  'tabs:element-exists': ExtensionWSAckElementHandler<
    [multiple: boolean],
    boolean | number[]
  >;
}

export interface ExtensionWSInterServerEvents {}

export interface ExtensionSocketData {
  browserInfo: BrowserInfo;
}
