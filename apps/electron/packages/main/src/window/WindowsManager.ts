import type { BrowserWindow } from 'electron';
import { createCommandWindow } from './command-window';
import { createMainWindow } from './main-window';
import type { IPCSendEvents } from '#packages/common/interface/ipc-events.interface';

const windows = {
  main: createMainWindow,
  command: createCommandWindow,
};

type Windows = typeof windows;

class WindowsManager {
  private static _instance: WindowsManager | null = null;
  static get instance() {
    if (!this._instance) {
      this._instance = new WindowsManager();
    }

    return this._instance;
  }

  private windows: Map<keyof Windows, BrowserWindow> = new Map();

  constructor() {}

  async restoreOrCreateWindow(name: keyof Windows) {
    const window = await this.createWindow(name);

    if (window.isMinimized()) {
      window.restore();
    }

    window.focus();

    return window;
  }

  async createWindow(name: keyof Windows) {
    let window = this.windows.get(name);
    if (window && !window.isDestroyed()) return window;

    window = await windows[name]();
    this.windows.set(name, window);

    return window;
  }

  getWindow(name: keyof Windows, options?: { noThrow: false }): BrowserWindow;
  getWindow(
    name: keyof Windows,
    options?: { noThrow: true },
  ): BrowserWindow | null;
  getWindow(
    name: keyof Windows,
    options?: { noThrow: boolean },
  ): BrowserWindow | null {
    const window = this.windows.get(name);
    if (!window) {
      if (options?.noThrow) return null;

      throw new Error(`${name} window hasn't been initialized`);
    }

    return window;
  }

  sendMessageToWindow<T extends keyof IPCSendEvents>(
    windowName: keyof Windows,
    eventName: T,
    ...args: IPCSendEvents[T]
  ) {
    const window = this.getWindow(windowName);
    return window.webContents.send(eventName, ...args);
  }
}

export default WindowsManager;
