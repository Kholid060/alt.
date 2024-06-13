import type { IPCUserExtensionEventsMap } from '#common/interface/ipc-events.interface';
import type {
  ExtensionAPIMessagePayload,
  ExtensionBrowserTabContext,
} from '#packages/common/interface/extension.interface';
import { isIPCEventError } from '#packages/common/utils/helper';
import { isObject } from '@alt-dot/shared';

class ExtensionWorkerMessagePort {
  private messages: Map<
    string,
    { resolve(value: unknown): void; reject(reason?: unknown): void }
  > = new Map();
  private _messageId = 0;

  commandId: string;
  extensionKey: string;
  messagePort: MessagePort;
  browserCtx: ExtensionBrowserTabContext;

  constructor({
    key,
    commandId,
    browserCtx,
    messagePort,
  }: {
    key: string;
    commandId: string;
    messagePort: MessagePort;
    browserCtx: ExtensionBrowserTabContext;
  }) {
    this.extensionKey = key;
    this.commandId = commandId;
    this.browserCtx = browserCtx;
    this.messagePort = messagePort;

    this.onMessage = this.onMessage.bind(this);

    this._init();
  }

  private _init() {
    this.messagePort.start();
    this.messagePort.addEventListener('message', this.onMessage);
  }

  private onMessage({
    data,
  }: MessageEvent<{ messageId: string; result: unknown }>) {
    if (!isObject(data) || !data.messageId) return;

    const promise = this.messages.get(data.messageId);
    if (!promise) return;

    if (isIPCEventError(data.result)) {
      promise.reject(new Error(data.result.message));
      this.messages.delete(data.messageId);
      return;
    }

    promise.resolve(data.result);
    this.messages.delete(data.messageId);
  }

  private get messageId() {
    this._messageId += 1;

    return this._messageId;
  }

  sendMessage<K extends keyof IPCUserExtensionEventsMap>(
    name: K,
    ...args: Parameters<IPCUserExtensionEventsMap[K]>
  ) {
    const messageId = this.messageId.toString();
    const { promise, reject, resolve } = Promise.withResolvers();

    this.messages.set(messageId, {
      reject,
      resolve,
    });
    this.messagePort.postMessage({
      name,
      args,
      messageId,
      key: this.extensionKey,
      commandId: this.commandId,
      browserCtx: this.browserCtx,
    } as Omit<ExtensionAPIMessagePayload, 'sender'>);

    return promise;
  }

  destroy() {
    this.messagePort.removeEventListener('message', this.onMessage);
    this.messagePort.close();

    this.messages.clear();
  }
}

export default ExtensionWorkerMessagePort;
