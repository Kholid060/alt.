/* eslint-disable @typescript-eslint/no-explicit-any */
import { isObject } from '@repo/shared';
import { nanoid } from 'nanoid/non-secure';

const EVENT_TIMEOUT_MS = 10000; // 10 seconds;

export interface BetterMessagePortOptions {
  additionalMessagePayload?: Record<string, unknown>;
}

export interface BetterMessagePortResult {
  name: string;
  type: 'result';
  error?: boolean;
  result?: unknown;
  errorMessage?: string;
}

export interface BetterMessagePortSend {
  name: string;
  type: 'send';
  args: unknown[];
  isSync?: boolean;
  messageId?: string;
}

export type PromiseMessagePayload =
  | BetterMessagePortSend
  | BetterMessagePortResult;

type FuncType = (...args: any) => any;
type MessagePortType = MessagePort | Electron.MessagePortMain;

type ExtractParams<T, K extends keyof T> = T[K] extends FuncType
  ? Parameters<T[K]>
  : T[K] extends Array<any>
    ? T[K]
    : [T[K]];
type ExtractReturnType<T, K extends keyof T> = T[K] extends FuncType
  ? ReturnType<T[K]>
  : void;

function normalizeMessagePort(messagePort: MessagePortType) {
  const isMain = 'addEventListener' in messagePort;

  return {
    postMessage: messagePort.postMessage.bind(messagePort),
    onMessage<T = any>(callback: (event: { data: T }) => void) {
      if (isMain) messagePort.addEventListener('message', callback);
      else messagePort.addListener('message', callback);
    },
    offMessage<T = any>(callback: (event: { data: T }) => void) {
      if (isMain) messagePort.removeEventListener('message', callback);
      else messagePort.removeListener('message', callback);
    },
  };
}
type NormalizeMessagePort = ReturnType<typeof normalizeMessagePort>;

class AsyncMessagePort<MessagePortEvents> {
  private messages: Map<
    PropertyKey,
    { resolve(value: any): void; reject(reason?: any): void }
  > = new Map();
  private listeners: Map<PropertyKey, (...args: any) => any> = new Map();

  constructor(private messagePort: NormalizeMessagePort) {
    this._onMessage = this._onMessage.bind(this);
    this.messagePort.onMessage(this._onMessage);
  }

  private async _onMessage({ data }: { data: PromiseMessagePayload }) {
    if (
      !isObject(data) ||
      (data.type !== 'result' && data.type !== 'send') ||
      data.isSync
    )
      return;

    if (data.type === 'result') {
      const promise = this.messages.get(data.name);
      if (promise) {
        if (data.error) {
          promise.reject(data.errorMessage);
        } else {
          promise.resolve(data.result);
        }

        this.messages.delete(data.name);
      }

      return;
    }

    const messageListener = this.listeners.get(data.name);
    const payload: BetterMessagePortResult = {
      type: 'result',
      name: data.messageId || data.name,
    };

    if (!messageListener) {
      payload.error = true;
      payload.errorMessage = `"${data.name}" doesn't have handler`;
    } else {
      payload.result = await messageListener(...data.args);
    }

    this.messagePort.postMessage(payload);
  }

  on<K extends keyof MessagePortEvents>(
    name: K,
    callback: (
      ...args: ExtractParams<MessagePortEvents, K>
    ) => ExtractReturnType<MessagePortEvents, K>,
  ) {
    this.listeners.set(name, callback);
  }

  off<K extends keyof MessagePortEvents>(name: K) {
    this.listeners.delete(name);
  }

  sendMessage<K extends keyof MessagePortEvents>(
    name: K,
    ...args: ExtractParams<MessagePortEvents, K>
  ): Promise<ExtractReturnType<MessagePortEvents, K>> {
    return new Promise((resolve, reject) => {
      const messageId = `promise::${nanoid(5)}`;

      const timeout = setTimeout(() => {
        reject(new Error('TIMEOUT'));
        this.messages.delete(messageId);
      }, EVENT_TIMEOUT_MS);

      this.messages.set(messageId, {
        resolve(value) {
          clearTimeout(timeout);
          resolve(value);
        },
        reject(reason) {
          clearTimeout(timeout);
          reject(reason);
        },
      });

      this.messagePort.postMessage({
        name,
        args,
        messageId,
        type: 'send',
      } as BetterMessagePortSend);
    });
  }

  destroy() {
    this.messagePort.offMessage(this._onMessage);
    this.messages.forEach((message) => {
      message.reject(new Error('DESTROYED'));
    });
  }
}

class SyncMessagePort<MessagePortEvents> {
  private listeners: Record<PropertyKey, ((...args: any) => any)[]> = {};

  constructor(private messagePort: NormalizeMessagePort) {
    this._onMessage = this._onMessage.bind(this);
    this.messagePort.onMessage(this._onMessage);
  }

  private _onMessage({ data }: { data: PromiseMessagePayload }) {
    if (!isObject(data) || data.type === 'result' || !data.isSync) return;

    const listeners = this.listeners[data.name];
    if (!listeners) return;

    listeners.forEach((listener) => listener(...data.args));
  }

  on<K extends keyof MessagePortEvents>(
    name: K,
    callback: (...args: ExtractParams<MessagePortEvents, K>) => void,
  ) {
    if (!this.listeners[name]) this.listeners[name] = [];

    this.listeners[name].push(callback);
  }

  off<K extends keyof MessagePortEvents>(
    name: K,
    callback: (...args: ExtractParams<MessagePortEvents, K>) => void,
  ) {
    if (!this.listeners[name]) return;

    const index = this.listeners[name].indexOf(callback);
    if (index === -1) return;

    this.listeners[name].splice(index, 1);
  }

  sendMessage<K extends keyof MessagePortEvents>(
    name: K,
    ...args: ExtractParams<MessagePortEvents, K>
  ): void {
    this.messagePort.postMessage({
      name,
      args,
      type: 'send',
      isSync: true,
    } as BetterMessagePortSend);
  }

  destroy() {
    this.listeners = {};
    this.messagePort.offMessage(this._onMessage);
  }
}

class BetterMessagePort<MessagePortEvents> {
  sync: SyncMessagePort<MessagePortEvents>;
  async: AsyncMessagePort<MessagePortEvents>;

  constructor(private messagePort: MessagePortType) {
    const nomalizedMessagePort = normalizeMessagePort(messagePort);

    messagePort.start();

    this.sync = new SyncMessagePort(nomalizedMessagePort);
    this.async = new AsyncMessagePort(nomalizedMessagePort);
  }

  destroy() {
    this.messagePort.close();

    this.sync.destroy();
    this.async.destroy();
  }
}

export default BetterMessagePort;
