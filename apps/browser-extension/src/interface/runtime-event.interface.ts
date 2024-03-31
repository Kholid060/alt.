import {
  BrowserGetTextOptions,
  KeyboardBrowserTypeOptions,
} from '@repo/shared';
import Browser from 'webextension-polyfill';

export interface RuntimeEvent {
  'element:click': (selector: string) => void;
  'element:get-text': (
    selector?: string,
    options?: Partial<BrowserGetTextOptions>,
  ) => string;
  'element:keyboard-type': (
    selector: string,
    text: string,
    options?: Partial<KeyboardBrowserTypeOptions>,
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
