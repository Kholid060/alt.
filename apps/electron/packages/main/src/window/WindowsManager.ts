import type { BrowserWindow } from 'electron';
import { createCommandWindow } from './command-window';
import { createMainWindow } from './main-window';

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
    let window = this.windows.get(name);

    if (window === undefined || window.isDestroyed()) {
      window = await windows[name]();
      this.windows.set(name, window);
    }

    if (window.isMinimized()) {
      window.restore();
    }

    window.focus();
  }

  async createWindow(name: keyof Windows) {
    let window = this.windows.get(name);
    if (window && !window.isDestroyed()) return window;

    window = await windows[name]();
    this.windows.set(name, window);

    return window;
  }

  getWindow(name: keyof Windows) {
    const window = this.windows.get(name);
    if (!window) throw new Error(`${name} window hasn't been initialized`);

    return window;
  }
}

export default WindowsManager;