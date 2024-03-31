import Browser from 'webextension-polyfill';
import {
  RuntimeEvent,
  RuntimeEventPayload,
} from '../interface/runtime-event.interface';
import { isObject } from '@repo/shared';

class RuntimeMessage {
  private static _instance: RuntimeMessage | null = null;
  static get instance() {
    if (!this._instance) {
      this._instance = new RuntimeMessage();
    }

    return this._instance;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private listeners: Map<string, (...args: any[]) => unknown> = new Map();

  constructor() {
    this._runtimeMessageListener = this._runtimeMessageListener.bind(this);
    this._init();
  }

  private _init() {
    Browser.runtime.onMessage.addListener(this._runtimeMessageListener);
  }

  private async _runtimeMessageListener(
    message: RuntimeEventPayload,
    sender: Browser.Runtime.MessageSender,
  ) {
    if (!isObject(message) || !message.name) return;

    const listener = this.listeners.get(message.name);
    if (!listener) throw new Error(`"${message.name}" doesn't have handler`);

    return await listener({ sender }, ...message.args);
  }

  onMessage<T extends keyof RuntimeEvent>(
    name: T,
    callback: (
      ...args: [
        { sender: Browser.Runtime.MessageSender },
        ...Parameters<RuntimeEvent[T]>,
      ]
    ) => Promise<ReturnType<RuntimeEvent[T]>>,
  ) {
    this.listeners.set(name, callback);
  }

  sendMessageToTab<T extends keyof RuntimeEvent>({
    args,
    name,
    tabId,
    frameId,
  }: {
    name: T;
    args: Parameters<RuntimeEvent[T]>;
    tabId: number;
    frameId?: number;
  }): Promise<ReturnType<RuntimeEvent[T]>> {
    return Browser.tabs.sendMessage(tabId, { name, args }, { frameId });
  }

  sendMessage<T extends keyof RuntimeEvent>(
    name: T,
    ...args: Parameters<RuntimeEvent[T]>
  ): Promise<ReturnType<RuntimeEvent[T]>> {
    return Browser.runtime.sendMessage({ name, args });
  }
}

export default RuntimeMessage;
