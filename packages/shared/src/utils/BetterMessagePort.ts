/// <reference lib="dom" />
import { ElectronMessagePortPolyfill } from '../interfaces/polyfill.interface';
import { generateRandomString, isObject } from './helper';

/* eslint-disable @typescript-eslint/no-explicit-any */
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

export type BetterMessagePayload =
  | BetterMessagePortSend
  | BetterMessagePortResult;

type FuncType = (...args: any) => any;
type MessagePortType = MessagePort | ElectronMessagePortPolyfill;

type ExtractParams<T, K extends keyof T> = T[K] extends FuncType
  ? Parameters<T[K]>
  : T[K] extends Array<any>
    ? T[K]
    : [T[K]];
type ExtractReturnType<T, K extends keyof T> = T[K] extends FuncType
  ? ReturnType<T[K]>
  : void;

export interface NormalizeMessagePort {
  postMessage: MessagePortType['postMessage'];
  onMessage<T = any>(callback: (event: { data: T }) => void): void;
  offMessage<T = any>(callback: (event: { data: T }) => void): void;
}

type PostMessageFunc = (data: unknown) => void;

export class BetterMessagePortAsync<MessagePortEvents> {
  private messages: Map<
    PropertyKey,
    { resolve(value: any): void; reject(reason?: any): void }
  > = new Map();
  private listeners: Map<PropertyKey, (...args: any) => any> = new Map();

  constructor(private postMessage: PostMessageFunc) {}

  async messageHandler(data: BetterMessagePayload) {
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
          promise.reject(new Error(data.errorMessage));
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
      this.postMessage(payload);
      return;
    }

    try {
      payload.result = await messageListener(...data.args);
    } catch (error) {
      payload.error = true;
      payload.errorMessage = (error as Error).message;
    }

    this.postMessage(payload);
  }

  on<K extends keyof MessagePortEvents>(
    name: K,
    callback: (
      ...args: ExtractParams<MessagePortEvents, K>
    ) => ExtractReturnType<MessagePortEvents, K>,
  ) {
    this.listeners.set(name, callback);

    return () => this.listeners.delete(name);
  }

  off<K extends keyof MessagePortEvents>(name: K) {
    this.listeners.delete(name);
  }

  sendMessage<K extends keyof MessagePortEvents>(
    name: K,
    ...args: ExtractParams<MessagePortEvents, K>
  ): Promise<ExtractReturnType<MessagePortEvents, K>> {
    return new Promise((resolve, reject) => {
      const messageId = `promise::${generateRandomString(8)}`;

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

      this.postMessage({
        name,
        args,
        messageId,
        type: 'send',
      } as BetterMessagePortSend);
    });
  }

  destroy() {
    this.messages.forEach((message) => {
      message.reject(new Error('CLOSED'));
    });
  }
}

export class BetterMessagePortSync<MessagePortEvents> {
  private listeners: Record<PropertyKey, ((...args: any) => any)[]> = {};

  constructor(private postMessage: PostMessageFunc) {}

  messageHandler(data: BetterMessagePayload) {
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

    return () => this.off(name, callback);
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
    this.postMessage({
      name,
      args,
      type: 'send',
      isSync: true,
    } as BetterMessagePortSend);
  }

  destroy() {
    this.listeners = {};
  }
}

class BetterMessagePort<AsyncEvents = unknown, SyncEvents = unknown> {
  sync: BetterMessagePortSync<SyncEvents>;
  async: BetterMessagePortAsync<AsyncEvents>;

  private nomalizedMessagePort: NormalizeMessagePort;

  constructor(private messagePort: MessagePortType) {
    this.nomalizedMessagePort =
      BetterMessagePort.normalizeMessagePort(messagePort);

    this.sync = new BetterMessagePortSync(
      this.nomalizedMessagePort.postMessage,
    );
    this.async = new BetterMessagePortAsync(
      this.nomalizedMessagePort.postMessage,
    );

    this.onMessage = this.onMessage.bind(this);
    this.nomalizedMessagePort.onMessage(this.onMessage);

    messagePort.start();
  }

  private onMessage({ data }: { data: BetterMessagePayload }) {
    if (data?.type === 'send' && data.isSync) {
      this.sync.messageHandler(data);
    } else {
      this.async.messageHandler(data);
    }
  }

  destroy() {
    this.nomalizedMessagePort.offMessage(this.onMessage);

    this.messagePort.close();

    this.sync.destroy();
    this.async.destroy();
  }

  static normalizeMessagePort(
    messagePort: MessagePortType,
  ): NormalizeMessagePort {
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

  static createStandalone<Events>(
    type: 'async',
    port: MessagePortType,
  ): BetterMessagePortAsync<Events>;
  static createStandalone<Events>(
    type: 'sync',
    port: MessagePortType,
  ): BetterMessagePortSync<Events>;
  static createStandalone<Events>(
    type: 'sync' | 'async',
    port: MessagePortType,
  ): BetterMessagePortSync<Events> | BetterMessagePortAsync<Events> {
    const messagePort = BetterMessagePort.normalizeMessagePort(port);
    let betterMessagePort:
      | BetterMessagePortAsync<Events>
      | BetterMessagePortSync<Events>;

    if (type === 'async') {
      betterMessagePort = new BetterMessagePortAsync(messagePort.postMessage);
    } else {
      betterMessagePort = new BetterMessagePortSync(messagePort.postMessage);
    }

    messagePort.onMessage(({ data }) => {
      betterMessagePort.messageHandler(data);
    });

    port.start();

    return betterMessagePort;
  }
}
export default BetterMessagePort;
