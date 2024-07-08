import type ExtensionAPI from '@altdot/extension-core/types/extension-api';
import {
  BrowserGetHTMLOptions,
  BrowserGetTextOptions,
  ExtensionBrowserElementSelector,
  KeyboardBrowserTypeOptions,
} from '@altdot/shared';
import Browser from 'webextension-polyfill';

export interface RuntimeEvent {
  'element:click': (selector: ExtensionBrowserElementSelector) => void;
  'element:mouse-up': (selector: ExtensionBrowserElementSelector) => void;
  'element:mouse-down': (selector: ExtensionBrowserElementSelector) => void;
  'element:select': (
    selector: ExtensionBrowserElementSelector,
    ...values: string[]
  ) => string[];
  'element:key-down': (
    selector: ExtensionBrowserElementSelector,
    key: string,
    options?: ExtensionAPI.browser.KeyDownOptions,
  ) => void;
  'element:key-up': (
    selector: ExtensionBrowserElementSelector,
    key: string,
    options?: ExtensionAPI.browser.KeyUpOptions,
  ) => void;
  'element:press': (
    selector: ExtensionBrowserElementSelector,
    key: string,
    options?: ExtensionAPI.browser.KeyUpOptions &
      ExtensionAPI.browser.KeyDownOptions,
  ) => void;
  'element:get-text': (
    selector?: ExtensionBrowserElementSelector,
    options?: BrowserGetTextOptions,
  ) => string;
  'element:get-html': (
    selector?: ExtensionBrowserElementSelector,
    options?: BrowserGetHTMLOptions,
  ) => string;
  'element:keyboard-type': (
    selector: ExtensionBrowserElementSelector,
    text: string,
    options?: Partial<KeyboardBrowserTypeOptions>,
  ) => void;
  'element:get-attributes': (
    selector: ExtensionBrowserElementSelector,
    attrNames?: string | string[],
  ) => string | null | Record<string, string>;
  'element:set-attributes': (
    selector: ExtensionBrowserElementSelector,
    attrs: Record<string, string>,
  ) => void;
  'element:element-exists': (
    selector: string,
    multiple?: boolean,
  ) => boolean | number[];
  'element:select-element': (
    filter?: ExtensionAPI.browser.activeTab.SelectElementOptions,
  ) => { canceled: boolean; selector: string };
  'element:wait-selector': (
    selector: ExtensionBrowserElementSelector,
    option?: ExtensionAPI.browser.WaitForSelectorOptions,
  ) => void;
  'element:select-file': (
    selector: ExtensionBrowserElementSelector,
    fileId: string,
  ) => void;
}

export interface RuntimeEventPayload {
  name: string;
  args: unknown[];
}

export type RuntimeMessageHandler<T extends keyof RuntimeEvent> = (
  ...args: [
    { sender: Browser.Runtime.MessageSender },
    ...Parameters<RuntimeEvent[T]>,
  ]
) => ReturnType<RuntimeEvent[T]>;
