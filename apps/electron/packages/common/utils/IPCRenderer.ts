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
import { isObject } from '@repo/shared';
import { ipcRenderer } from 'electron';

class IPCRenderer {
  static invoke<
    T extends keyof IPCEvents,
    K extends IPCEvents[T] = IPCEvents[T],
  >(name: T, ...args: Parameters<K>) {
    return ipcRenderer.invoke(name, ...args) as Promise<
      ReturnType<K> | IPCEventError
    >;
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

  static createInvokeHandler() {
    const handlers = new Map<
      string,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (...args: any[]) => unknown | Promise<unknown>
    >();

    ipcRenderer.on(
      IPC_ON_EVENT.rendererInvoke,
      async (_, message: IPCRendererInvokeEventPayload) => {
        if (
          !isObject(message) ||
          Object.hasOwn(message, 'type') ||
          Object.hasOwn(message, 'messageId')
        )
          return;

        let payload: IPCRendererInvokeEventType;

        const handler = handlers.get(message.name);
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
      },
    );

    return <T extends keyof IPCRendererInvokeEvent>(
      name: T,
      callback: (
        ...args: Parameters<IPCRendererInvokeEvent[T]>
      ) => ReturnType<IPCRendererInvokeEvent[T]>,
    ) => {
      handlers.set(name, callback);
    };
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
