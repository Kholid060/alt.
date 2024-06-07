import { BrowserWindow } from 'electron';
import { screen } from 'electron';
import { store } from '../lib/store';
import { EventEmitter } from 'eventemitter3';
import type { WindowNames } from '#packages/common/interface/window.interface';
import type {
  IPCPostMessageEventMainToRenderer,
  IPCRendererInvokeEvent,
  IPCRendererInvokeEventPayload,
  IPCRendererInvokeEventType,
  IPCRendererSendEvent,
} from '#packages/common/interface/ipc-events.interface';
import { isObject } from '@repo/shared';
import { IPC_ON_EVENT } from '#packages/common/utils/constant/constant';
import { nanoid } from 'nanoid';
import { logger } from '../lib/log';
import { debugLog } from '#packages/common/utils/helper';

interface WindowBaseEvents {}

interface WindowBaseHooks {
  'window:created': (window: BrowserWindow) => Promise<void> | void;
}

export enum WindowBaseState {
  Open = 'open',
  Hidden = 'hidden',
  Closed = 'closed',
}

export interface WindowMessageName<T extends string> {
  name: T;
  noThrow?: boolean;
  ensureWindow?: boolean;
}

function getMessagePayload<T extends string>(
  eventName: T | WindowMessageName<T>,
): Required<WindowMessageName<T>> {
  if (typeof eventName === 'string') {
    return {
      noThrow: false,
      name: eventName,
      ensureWindow: true,
    };
  }

  return {
    noThrow: false,
    ensureWindow: true,
    ...eventName,
  };
}

class WindowBaseInvokeMessage {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  messages = new Map<string, PromiseWithResolvers<any>>();

  constructor() {
    this.onReceiveResult = this.onReceiveResult.bind(this);
  }

  onReceiveResult(
    _: Electron.IpcMainEvent,
    message: IPCRendererInvokeEventType,
  ) {
    if (
      !isObject(message) ||
      !Object.hasOwn(message, 'type') ||
      !this.messages.has(message.messageId)
    )
      return;

    const { resolve, reject } = this.messages.get(message.messageId)!;

    if (message.type === 'success') {
      resolve(message.result);
    } else {
      reject(new Error(message.errorMessage));
    }

    this.messages.delete(message.messageId);
  }

  clearMessages() {
    this.messages.forEach((resolver) => {
      resolver.reject(new Error('CLOSED'));
    });
    this.messages.clear();
  }
}

class WindowBase extends EventEmitter<WindowBaseEvents> {
  private _state: WindowBaseState = WindowBaseState.Closed;
  private hooks: Partial<{
    [P in keyof WindowBaseHooks]: WindowBaseHooks[P][];
  }> = {};

  private invokeMessages: WindowBaseInvokeMessage =
    new WindowBaseInvokeMessage();

  webContentId: number;
  windowId: WindowNames;
  window: BrowserWindow | null;

  constructor(
    windowId: WindowNames,
    private options?: Electron.BrowserWindowConstructorOptions,
  ) {
    super();

    this.windowId = windowId;

    this.window = null;
    this.webContentId = -1;

    this._state = WindowBaseState.Closed;
  }

  get state() {
    return this._state;
  }

  async createWindow() {
    if (this.window) return this.window;

    debugLog(`Creating "${this.windowId}" window`);

    const browserWindow = new BrowserWindow(this.options);
    this.window = browserWindow;

    this.webContentId = browserWindow.webContents.id;

    browserWindow.on('hide', () => {
      this._state = WindowBaseState.Hidden;
      this.sendMessage('window:visibility-change', true);
    });
    browserWindow.on('show', () => {
      this._state = WindowBaseState.Open;
      this.sendMessage('window:visibility-change', false);
    });
    browserWindow.once('closed', () => {
      this.window = null;
      this.webContentId = -1;
      this._state = WindowBaseState.Closed;
    });

    browserWindow.webContents.ipc.on(
      IPC_ON_EVENT.rendererInvoke,
      this.invokeMessages.onReceiveResult,
    );

    await Promise.all(
      this.hooks['window:created']?.map((callback) =>
        callback(browserWindow),
      ) ?? [],
    );

    return browserWindow;
  }

  async ensureWindow() {
    if (this.window && !this.window.isDestroyed()) return;

    await this.createWindow();
  }

  hook<T extends keyof WindowBaseHooks>(name: T, callback: WindowBaseHooks[T]) {
    if (!this.hooks[name]) {
      this.hooks[name] = [];
    }

    this.hooks[name]!.push(callback);
  }

  hookOff<T extends keyof WindowBaseHooks>(
    name: T,
    callback: WindowBaseHooks[T],
  ) {
    const index = this.hooks[name]?.indexOf(callback);
    if (typeof index !== 'number' || index === -1) return;

    this.hooks[name]!.splice(index, 1);
  }

  async sendMessage<T extends keyof IPCRendererSendEvent>(
    eventName: T | WindowMessageName<T>,
    ...args: IPCRendererSendEvent[T]
  ) {
    const { name, noThrow, ensureWindow } = getMessagePayload(eventName);
    if (!this.window) {
      if (ensureWindow) {
        await this.createWindow();
      } else if (!noThrow) {
        throw new Error(`"${this.windowId}" hasn't been initialized`);
      }
    }

    this.window?.webContents.send(name, ...args);
  }

  async postMessage<T extends keyof IPCPostMessageEventMainToRenderer>(
    eventName: T | WindowMessageName<T>,
    data: IPCPostMessageEventMainToRenderer[T][0],
    ports?: Electron.MessagePortMain[],
  ) {
    const { name, noThrow, ensureWindow } = getMessagePayload(eventName);
    if (!this.window) {
      if (ensureWindow) {
        await this.createWindow();
      } else if (!noThrow) {
        throw new Error(`"${this.windowId}" hasn't been initialized`);
      }
    }

    this.window?.webContents.postMessage(name, data, ports);
  }

  async invoke<
    T extends keyof IPCRendererInvokeEvent,
    R extends ReturnType<IPCRendererInvokeEvent[T]>,
  >(
    eventName: T | WindowMessageName<T>,
    ...args: Parameters<IPCRendererInvokeEvent[T]>
  ): Promise<R> {
    debugLog(`Invoke{${this.windowId}}`, eventName);
    const messageId = nanoid(5);

    try {
      const { name, noThrow, ensureWindow } = getMessagePayload(eventName);
      if (!this.window) {
        if (ensureWindow) {
          await this.createWindow();
        } else if (!noThrow) {
          throw new Error(`"${this.windowId}" hasn't been initialized`);
        }
      }

      const resolver = Promise.withResolvers<R>();
      this.invokeMessages.messages.set(messageId, resolver);

      this.window?.webContents.send(IPC_ON_EVENT.rendererInvoke, {
        args,
        name,
        messageId,
      } as IPCRendererInvokeEventPayload);

      return resolver.promise;
    } catch (error) {
      logger('error', ['IPCMain', 'invoke'], error);

      this.invokeMessages.messages.get(messageId)?.reject(error);
      this.invokeMessages.messages.delete(messageId);

      throw error;
    }
  }

  destroy() {
    this.window?.destroy();

    this.invokeMessages.clearMessages();

    this.window = null;
    this.webContentId = -1;
    this._state = WindowBaseState.Closed;
  }

  saveWindowBounds(bounds: Electron.Rectangle) {
    store.set(`windowBounds.${this.windowId}`, bounds);
  }

  getWindowBounds() {
    const bounds = store.get(
      `windowBounds.${this.windowId}`,
      null,
    ) as Electron.Rectangle | null;
    if (!bounds) return null;

    const display = screen.getDisplayNearestPoint({
      x: bounds.x,
      y: bounds.y,
    });

    if (
      !(bounds.x > display.bounds.x && bounds.x < display.size.width) ||
      !(bounds.y > display.bounds.y && bounds.y < display.size.height)
    ) {
      bounds.x = display.bounds.x;
      bounds.y = display.bounds.y;
    }

    return bounds;
  }

  async restoreOrCreateWindow() {
    const window = await this.createWindow();

    if (window.isMinimized()) {
      window.restore();
    }

    window.focus();
  }
}

export default WindowBase;
