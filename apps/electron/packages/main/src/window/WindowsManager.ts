import type { BrowserWindow } from 'electron';
import type { IPCRendererSendEvent } from '#packages/common/interface/ipc-events.interface';
import WindowCommand from './command-window';
import WindowDashboard from './dashboard-window';

const windows = {
  command: WindowCommand.instance,
  dashboard: WindowDashboard.instance,
};

export type WindowManagerWindows = typeof windows;
export type WindowManagerWindowNames = keyof WindowManagerWindows;

class WindowsManager {
  private static _instance: WindowsManager | null = null;
  static get instance() {
    if (!this._instance) {
      this._instance = new WindowsManager();
    }

    return this._instance;
  }

  private windows: Map<WindowManagerWindowNames, BrowserWindow> = new Map();
  private windowsHiddenState: Map<WindowManagerWindowNames, boolean> =
    new Map();

  constructor() {}

  async restoreOrCreateWindow(name: WindowManagerWindowNames) {
    const window = await this.createWindow(name);

    if (window.isMinimized()) {
      window.restore();
    }

    window.focus();

    return window;
  }

  getAllWindows() {
    return [...this.windows.entries()].map((name, window) => ({
      name,
      window,
    }));
  }

  async createWindow(name: WindowManagerWindowNames) {
    let window = this.windows.get(name);
    if (window && !window.isDestroyed()) return window;

    window = await windows[name].createWindow();
    if (!window) throw new Error('Invalid window name');

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

  isWindowHidden(name: WindowManagerWindowNames) {
    return this.windowsHiddenState.get(name) ?? true;
  }

  getWindow(
    name: WindowManagerWindowNames,
    options?: { noThrow: false },
  ): BrowserWindow;
  getWindow(
    name: WindowManagerWindowNames,
    options?: { noThrow: true },
  ): BrowserWindow | null;
  getWindow(
    name: WindowManagerWindowNames,
    options?: { noThrow: boolean },
  ): BrowserWindow | null {
    const window = this.windows.get(name);
    if (!window) {
      if (options?.noThrow) return null;

      throw new Error(`${name} window hasn't been initialized`);
    }

    return window;
  }

  sendMessageToAllWindows<T extends keyof IPCRendererSendEvent>({
    args,
    name,
    excludeWindow,
  }: {
    name: T;
    args: IPCRendererSendEvent[T];
    excludeWindow?: (WindowManagerWindowNames | number)[];
  }) {
    this.windows.forEach((browserWindow, key) => {
      if (
        excludeWindow &&
        (excludeWindow.includes(browserWindow.webContents.id) ||
          excludeWindow.includes(key))
      )
        return;

      browserWindow.webContents.send(name, ...args);
    });
  }

  sendMessageToWindow<T extends keyof IPCRendererSendEvent>(
    browserWindow: WindowManagerWindowNames | BrowserWindow,
    eventName: T,
    ...args: IPCRendererSendEvent[T]
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
