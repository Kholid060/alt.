import Browser from 'webextension-polyfill';

export interface RuntimeEvent {
  'element:click': (selector: string) => void;
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
