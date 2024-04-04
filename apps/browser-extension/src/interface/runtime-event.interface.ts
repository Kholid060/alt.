import type ExtensionAPI from '@repo/extension-core/types/extension-api';
import {
  BrowserGetTextOptions,
  ExtensionBrowserElementSelector,
  KeyboardBrowserTypeOptions,
} from '@repo/shared';
import Browser from 'webextension-polyfill';

export interface RuntimeEvent {
  'element:click': (selector: ExtensionBrowserElementSelector) => void;
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
    options?: Partial<BrowserGetTextOptions>,
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
  'element:element-exists': (
    selector: string,
    multiple?: boolean,
  ) => boolean | number[];
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
