/* eslint-disable @typescript-eslint/no-explicit-any */
import { ExtensionPermissions } from '#common/interface/extension.interface';
import { IPCUserExtensionEventsMap } from '#common/interface/ipc-events.interface';
import { isObject } from '@repo/shared';
import { nanoid } from 'nanoid/non-secure';

const EVENT_TIMEOUT_MS = 10000; // 10 seconds;

class ExtensionWorkerMessagePort {
  private messages: Map<
    string,
    { resolve(value: unknown): void; reject(reason?: any): void }
  > = new Map();

  extensionKey: string;
  messagePort: MessagePort;
  permissions: ExtensionPermissions[];

  constructor({
    key,
    messagePort,
    permissions,
  }: {
    key: string;
    messagePort: MessagePort;
    permissions: ExtensionPermissions[];
  }) {
    this.extensionKey = key;
    this.messagePort = messagePort;
    this.permissions = permissions;

    this.onMessage = this.onMessage.bind(this);

    this._init();
  }

  private _init() {
    this.messagePort.start();
    this.messagePort.addEventListener('message', this.onMessage);
  }

  private onMessage({
    data,
  }: MessageEvent<{ messageId: string; result: any }>) {
    if (!isObject(data) || !data.messageId) return;

    const promise = this.messages.get(data.messageId);
    if (!promise) return;

    if (isObject(data.result) && data.result !== null && '$isError' in data.result) {
      promise.reject(new Error(data.result.message));
      this.messages.delete(data.messageId);
      return;
    }

    promise.resolve(data.result);
    this.messages.delete(data.messageId);
  }

  sendMessage<K extends keyof IPCUserExtensionEventsMap>(
    name: K,
    ...args: Parameters<IPCUserExtensionEventsMap[K]>
  ) {
    return new Promise((resolve, reject) => {
      const messageId = nanoid(5);

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
        key: this.extensionKey,
      });
    });
  }

  destroy() {
    this.messagePort.removeEventListener('message', this.onMessage);
    this.messagePort.close();

    this.messages.clear();
  }
}

export default ExtensionWorkerMessagePort;
