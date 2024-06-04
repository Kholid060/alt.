import { BrowserExtensionTab, BrowserInfo } from './browser.interface';
import {
  KeyboardKeyUpOptions,
  KeyboardKeyDownOptions,
  KeyboardBrowserTypeOptions,
} from './keyboard.interface';

export interface BrowserGetTextOptions {
  onlyVisibleText: boolean;
}

export interface BrowserGetHTMLOptions {
  outerHTML: boolean;
}

export interface BrowserWaitForSelectorOptions {
  timeout?: number;
  state?: 'attached' | 'detached' | 'visible' | 'hidden';
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
}

export interface ExtensionBrowserElementSelector {
  selector: string;
  elementIndex?: number;
}

type ExtensionWSAckHandler<T extends unknown[] = [], R = void> = (
  ...args: [...T, cb: WSAckCallback<R>]
) => void;

type ExtensionWSAckTabHandler<T extends unknown[] = [], R = void> = (
  tab: ExtensionBrowserTabDetail,
  ...args: [...T, cb: WSAckCallback<R>]
) => void;

type ExtensionWSAckElementHandler<
  T extends unknown[] = [],
  R = void,
> = ExtensionWSAckTabHandler<
  [selector: ExtensionBrowserElementSelector, ...T],
  R
>;

export interface ExtensionActiveTabActionWSEvents {
  'tabs:click': ExtensionWSAckElementHandler;
  'tabs:mouse-up': ExtensionWSAckElementHandler;
  'tabs:mouse-down': ExtensionWSAckElementHandler;
  'tabs:type': ExtensionWSAckElementHandler<
    [text: string, options: Partial<KeyboardBrowserTypeOptions>]
  >;
  'tabs:get-text': ExtensionWSAckElementHandler<
    [options: Partial<BrowserGetTextOptions>],
    string
  >;
  'tabs:get-html': ExtensionWSAckElementHandler<
    [options: Partial<BrowserGetHTMLOptions>],
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
  'tabs:wait-for-selector': ExtensionWSAckElementHandler<
    [options: BrowserWaitForSelectorOptions]
  >;
  'tabs:select-element': ExtensionWSAckTabHandler<
    [
      options: {
        title?: string;
        description?: string;
        filter?: { selector?: string };
      },
    ],
    { canceled: boolean; selector: string }
  >;
  'tabs:reload': ExtensionWSAckTabHandler;
}

export interface ExtensionWSServerToClientEvents
  extends ExtensionActiveTabActionWSEvents {
  'tabs:get-active': ExtensionWSAckHandler<[], BrowserExtensionTab>;
  'tabs:create-new': ExtensionWSAckHandler<[url: string], BrowserExtensionTab>;
}

export interface ExtensionWSInterServerEvents {}

export interface ExtensionSocketData {
  browserInfo: BrowserInfo;
}
