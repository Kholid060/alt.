/* eslint-disable @typescript-eslint/no-explicit-any */
import { isObject } from '@repo/shared';
import { nanoid } from 'nanoid/non-secure';

const EVENT_TIMEOUT_MS = 10000; // 10 seconds;

export interface PromiseMessagePortOptions {
  additionalMessagePayload?: Record<string, unknown>;
}

export interface PromiseMessagePortResult {
  name: string;
  error?: boolean;
  result?: unknown;
  errorMessage?: string;
}

export interface PromiseMessagePayload {
  name: string;
  args: unknown[];
  messageId?: string;
}

type ExtractParams<T, K extends keyof T> = T[K] extends (...args: any) => any
  ? Parameters<T[K]>
  : T[K] extends Array<any>
    ? T[K]
    : [T[K]];

class PromiseMessagePort<MessagePortEvents> {
  private messages: Map<
    string,
    { resolve(args: unknown): void; reject(reason?: any): void }
  > = new Map();
  private messageListeners: Map<
    string | number | symbol,
    (...args: any) => void
  > = new Map();

  additionalMessagePayload: Record<string, unknown>;
  messagePort: MessagePort | Electron.MessagePortMain;

  constructor(
    messagePort: MessagePort | Electron.MessagePortMain,
    options: PromiseMessagePortOptions = {},
  ) {
    this.messagePort = messagePort;
    this.additionalMessagePayload = options.additionalMessagePayload ?? {};

    this._onMessage = this._onMessage.bind(this);

    this._init();
  }

  private _init() {
    this.messagePort.start();

    if ('addListener' in this.messagePort) {
      this.messagePort.addListener('message', this._onMessage);
    } else {
      this.messagePort.addEventListener('message', this._onMessage);
    }
  }

  private _onMessage({ data }: { data: PromiseMessagePortResult }) {
    if (!isObject(data)) return;

    const promise = this.messages.get(data.name);
    if (promise) {
      if (data.error) {
        promise.reject(data.errorMessage);
      } else {
        promise.resolve(data.result);
      }

      this.messages.delete(data.name);
    }

    const messageListener = this.messageListeners.get(data.name);
    if (messageListener) {
      messageListener(
        ...(Array.isArray(data.result) ? data.result : [data.result]),
      );
    }
  }

  onMessage<K extends keyof MessagePortEvents>(
    name: K,
    callback: (...args: ExtractParams<MessagePortEvents, K>) => void,
  ) {
    this.messageListeners.set(name, callback);
  }

  offMessage<K extends keyof MessagePortEvents>(name: K) {
    this.messageListeners.delete(name);
  }

  sendMessage<K extends keyof MessagePortEvents>(
    name: K,
    ...args: ExtractParams<MessagePortEvents, K>
  ) {
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
        ...this.additionalMessagePayload,
      });
    });
  }

  sendSyncMessage<K extends keyof MessagePortEvents>(
    name: K,
    ...args: ExtractParams<MessagePortEvents, K>
  ) {
    this.messagePort.postMessage({
      name,
      args,
      ...this.additionalMessagePayload,
    });
  }

  destroy() {
    if ('addListener' in this.messagePort) {
      this.messagePort.removeListener('message', this._onMessage);
    } else {
      this.messagePort.removeEventListener('message', this._onMessage);
    }

    this.messagePort.close();

    this.messages.clear();
    this.messageListeners.clear();
  }
}

export default PromiseMessagePort;
