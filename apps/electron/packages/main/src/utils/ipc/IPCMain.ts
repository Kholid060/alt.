import {
  CustomError,
  ExtensionError,
  ValidationError,
} from '#packages/common/errors/custom-errors';
import type {
  IPCEvents,
  IPCEventError,
  IPCRendererSendEvent,
  IPCMainSendEvent,
  IPCRendererInvokeEventType,
  IPCRendererInvokeEvent,
  IPCRendererInvokeEventPayload,
  IPCPostMessageEventMainToRenderer,
} from '#packages/common/interface/ipc-events.interface';
import type { BrowserWindow } from 'electron';
import { ipcMain } from 'electron';
import type { WindowManagerWindowNames } from '/@/window/WindowsManager';
import WindowsManager from '/@/window/WindowsManager';
import { IPC_ON_EVENT } from '#packages/common/utils/constant/constant';
import { isObject } from '@repo/shared';
import { nanoid } from 'nanoid/non-secure';

interface PromiseResolver<T = unknown> {
  resolve(value: T): void;
  reject(reason: unknown): void;
}

class IPCMain {
  private static _instance: IPCMain;

  static get instance() {
    return this._instance || (this._instance = new IPCMain());
  }

  private asyncMessages = new Map<string, PromiseResolver>();

  constructor() {
    this.onInvokeMessage = this.onInvokeMessage.bind(this);
    ipcMain.on(IPC_ON_EVENT.rendererInvoke, this.onInvokeMessage);
  }

  private onInvokeMessage(
    _: Electron.IpcMainEvent,
    message: IPCRendererInvokeEventType,
  ) {
    if (
      !isObject(message) ||
      !Object.hasOwn(message, 'type') ||
      !this.asyncMessages.has(message.messageId)
    )
      return;

    const { resolve, reject } = this.asyncMessages.get(message.messageId)!;

    if (message.type === 'success') {
      resolve(message.result);
    } else {
      reject(new Error(message.errorMessage));
    }

    this.asyncMessages.delete(message.messageId);
  }

  invoke<T extends keyof IPCRendererInvokeEvent>(
    window: BrowserWindow | WindowManagerWindowNames,
    name: T,
    ...args: Parameters<IPCRendererInvokeEvent[T]>
  ): Promise<ReturnType<IPCRendererInvokeEvent[T]>> {
    return new Promise((resolve, reject) => {
      const messageId = nanoid();
      this.asyncMessages.set(messageId, { reject, resolve });

      const browserWindow =
        typeof window === 'string'
          ? WindowsManager.instance.getWindow(window)
          : window;
      browserWindow.webContents.send(IPC_ON_EVENT.rendererInvoke, {
        args,
        name,
        messageId,
      } as IPCRendererInvokeEventPayload);
    });
  }

  static handle<T extends keyof IPCEvents, P extends Parameters<IPCEvents[T]>>(
    name: T,
    callback: (
      ...args: [Electron.IpcMainInvokeEvent, ...P]
    ) => Promise<ReturnType<IPCEvents[T]> | IPCEventError>,
  ) {
    ipcMain.handle(name, async (event, ...args) => {
      try {
        return await callback(event, ...(args as P));
      } catch (error) {
        if (
          error instanceof CustomError ||
          error instanceof ExtensionError ||
          error instanceof ValidationError
        ) {
          return {
            $isError: true,
            message: (error as Error).message,
          };
        }

        throw error;
      }
    });
  }

  static on<T extends keyof IPCMainSendEvent>(
    name: T,
    callback: (
      ...args: [event: Electron.IpcMainEvent, ...IPCMainSendEvent[T]]
    ) => void,
  ) {
    ipcMain.on(name, callback);
  }

  static off<T extends keyof IPCMainSendEvent>(
    name: T,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    callback: (...args: any[]) => void,
  ) {
    ipcMain.off(name, callback);
  }

  static sendToWindow<T extends keyof IPCRendererSendEvent>(
    window: BrowserWindow | WindowManagerWindowNames,
    name: T,
    ...args: IPCRendererSendEvent[T]
  ) {
    const browserWindow =
      typeof window === 'string'
        ? WindowsManager.instance.getWindow(window)
        : window;
    browserWindow.webContents.send(name, ...args);
  }

  static postMessageToWindow<T extends keyof IPCPostMessageEventMainToRenderer>(
    window: BrowserWindow | WindowManagerWindowNames,
    {
      data,
      name,
      ports,
    }: {
      name: T;
      data: IPCPostMessageEventMainToRenderer[T][0];
      ports?: Electron.MessagePortMain[];
    },
  ) {
    const browserWindow =
      typeof window === 'string'
        ? WindowsManager.instance.getWindow(window)
        : window;

    browserWindow.webContents.postMessage(name, data, ports);
  }
}

export default IPCMain;
