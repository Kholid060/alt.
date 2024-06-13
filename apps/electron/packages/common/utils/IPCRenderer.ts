import type {
  IPCEventError,
  IPCEvents,
  IPCMainSendEvent,
  IPCPostEventRendererToMain,
  IPCRendererInvokeEvent,
  IPCRendererInvokeEventPayload,
  IPCRendererInvokeEventType,
  IPCRendererSendEvent,
} from '#common/interface/ipc-events.interface';
import { IPC_ON_EVENT } from '#common/utils/constant/constant';
import { isObject } from '@alt-dot/shared';
import { ipcRenderer } from 'electron';
import { isIPCEventError } from './helper';

class IPCRenderer {
  private static _instance: IPCRenderer;

  static get instance() {
    return this._instance || (this._instance = new IPCRenderer());
  }

  private invokeHandlers = new Map<
    string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (...args: any[]) => unknown | Promise<unknown>
  >();

  constructor() {
    this.onInvokeEvent = this.onInvokeEvent.bind(this);
    ipcRenderer.on(IPC_ON_EVENT.rendererInvoke, this.onInvokeEvent);
  }

  private async onInvokeEvent(
    _event: Electron.IpcRendererEvent,
    message: IPCRendererInvokeEventPayload,
  ) {
    if (
      !isObject(message) ||
      !Object.hasOwn(message, 'name') ||
      !Object.hasOwn(message, 'messageId')
    )
      return;

    let payload: IPCRendererInvokeEventType;

    const handler = this.invokeHandlers.get(message.name);
    if (!handler) {
      payload = {
        type: 'error',
        messageId: message.messageId,
        errorMessage: `"${message.name}" doesn't have handler`,
      };
    } else {
      payload = {
        type: 'success',
        messageId: message.messageId,
        result: await handler(...message.args),
      };
    }

    ipcRenderer.send(IPC_ON_EVENT.rendererInvoke, payload);
  }

  handle<T extends keyof IPCRendererInvokeEvent>(
    name: T,
    callback: (
      ...args: Parameters<IPCRendererInvokeEvent[T]>
    ) => ReturnType<IPCRendererInvokeEvent[T]>,
  ) {
    if (this.invokeHandlers.has(name)) {
      console.warn(`"${name}" already has handler`);
    }

    this.invokeHandlers.set(name, callback);

    return () => {
      this.invokeHandlers.delete(name);
    };
  }

  static invoke<
    T extends keyof IPCEvents,
    K extends IPCEvents[T] = IPCEvents[T],
  >(name: T, ...args: Parameters<K>) {
    return ipcRenderer.invoke(name, ...args) as Promise<
      ReturnType<K> | IPCEventError
    >;
  }

  static async invokeWithError<
    T extends keyof IPCEvents,
    K extends IPCEvents[T] = IPCEvents[T],
  >(name: T, ...args: Parameters<K>) {
    const result = await (ipcRenderer.invoke(name, ...args) as Promise<
      ReturnType<K> | IPCEventError
    >);
    if (isIPCEventError(result)) {
      throw new Error(result.message);
    }

    return result;
  }

  static on<T extends keyof IPCRendererSendEvent>(
    name: T,
    listener: (
      event: Electron.IpcRendererEvent,
      ...args: IPCRendererSendEvent[T]
    ) => void,
  ) {
    ipcRenderer.on(name, listener);

    return () => {
      ipcRenderer.off(name, listener);
    };
  }

  static off<T extends keyof IPCRendererSendEvent>(
    name: T,
    listener: (
      event: Electron.IpcRendererEvent,
      ...args: IPCRendererSendEvent[T]
    ) => void,
  ) {
    ipcRenderer.off(name, listener);
  }

  static send<T extends keyof IPCMainSendEvent>(
    name: T,
    ...args: IPCMainSendEvent[T]
  ) {
    ipcRenderer.send(name, ...args);
  }

  static postMessage<T extends keyof IPCPostEventRendererToMain>(
    name: T,
    data: IPCPostEventRendererToMain[T][0],
    transfer?: MessagePort[],
  ) {
    ipcRenderer.postMessage(name, data, transfer);
  }
}

export default IPCRenderer;
