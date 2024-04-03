import type ExtensionAPI from '@repo/extension-core/types/extension-api';
import {
  BrowserGetTextOptions,
  KeyboardBrowserTypeOptions,
} from '@repo/shared';
import Browser from 'webextension-polyfill';

export interface RuntimeEvent {
  'element:click': (selector: string) => void;
  'element:select': (selector: string, ...values: string[]) => string[];
  'element:key-down': (
    selector: string,
    key: string,
    options?: ExtensionAPI.browser.KeyDownOptions,
  ) => void;
  'element:key-up': (
    selector: string,
    key: string,
    options?: ExtensionAPI.browser.KeyUpOptions,
  ) => void;
  'element:press': (
    selector: string,
    key: string,
    options?: ExtensionAPI.browser.KeyUpOptions &
      ExtensionAPI.browser.KeyDownOptions,
  ) => void;
  'element:get-text': (
    selector?: string,
    options?: Partial<BrowserGetTextOptions>,
  ) => string;
  'element:keyboard-type': (
    selector: string,
    text: string,
    options?: Partial<KeyboardBrowserTypeOptions>,
  ) => void;
  'element:get-attributes': (
    selector: string,
    attrNames?: string | string[],
  ) => string | null | Record<string, string>;
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
