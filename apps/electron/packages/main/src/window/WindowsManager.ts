import type { BrowserWindow } from 'electron';
import { createCommandWindow } from './command-window';
import { createMainWindow } from './main-window';
import type { IPCSendEvents } from '#packages/common/interface/ipc-events.interface';

const windows = {
  main: createMainWindow,
  command: createCommandWindow,
};

type Windows = typeof windows;
type WindowNames = keyof Windows;

class WindowsManager {
  private static _instance: WindowsManager | null = null;
  static get instance() {
    if (!this._instance) {
      this._instance = new WindowsManager();
    }

    return this._instance;
  }

  private windows: Map<WindowNames, BrowserWindow> = new Map();
  private windowsHiddenState: Map<WindowNames, boolean> = new Map();

  constructor() {}

  async restoreOrCreateWindow(name: WindowNames) {
    const window = await this.createWindow(name);

    if (window.isMinimized()) {
      window.restore();
    }

    window.focus();

    return window;
  }

  async createWindow(name: WindowNames) {
    let window = this.windows.get(name);
    if (window && !window.isDestroyed()) return window;

    window = await windows[name]();
    this.windows.set(name, window);
    this.windowsHiddenState.set(name, !window.isVisible());

    window.on('hide', () => {
      this.windowsHiddenState.set(name, true);
      this.sendMessageToWindow(window, 'window:visibility-change', true);
    });
    window.on('show', () => {
      this.windowsHiddenState.set(name, false);
      this.sendMessageToWindow(window, 'window:visibility-change', false);
    });

    return window;
  }

  isWindowHidden(name: WindowNames) {
    return this.windowsHiddenState.get(name) ?? true;
  }

  getWindow(name: WindowNames, options?: { noThrow: false }): BrowserWindow;
  getWindow(
    name: WindowNames,
    options?: { noThrow: true },
  ): BrowserWindow | null;
  getWindow(
    name: WindowNames,
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
    browserWindow: WindowNames | BrowserWindow,
    eventName: T,
    ...args: IPCSendEvents[T]
  ) {
    const window =
      typeof browserWindow === 'string'
        ? this.getWindow(browserWindow, { noThrow: true })
        : browserWindow;
    if (!window) return null;

    return window.webContents.send(eventName, ...args);
  }
}

export default WindowsManager;
