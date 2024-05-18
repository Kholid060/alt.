import { CUSTOM_SCHEME } from '#common/utils/constant/constant';
import { BrowserWindow, app, screen } from 'electron';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import WindowsManager from './WindowsManager';
import { centerWindow } from '../utils/helper';
import WindowUtils from './WindowUtils';
import type WindowBase from './WindowBase';

export const COMMNAND_WINDOW_BOUND = {
  width: 650,
  maxWidth: 650,
  minHeight: 400,
  maxHeight: 600,
} as const;

class WindowCommand extends WindowUtils implements WindowBase {
  private static _instance: WindowCommand | null = null;

  static get instance() {
    return this._instance || (this._instance = new WindowCommand());
  }

  private browserWindow: Electron.BrowserWindow | null = null;

  constructor() {
    super('command');
  }

  async createWindow(): Promise<Electron.BrowserWindow> {
    const cursorPos = screen.getCursorScreenPoint();
    const activeScreen = screen.getDisplayNearestPoint(cursorPos);

    const screenBound = activeScreen.bounds;

    const windowYPos = screenBound.height * 0.225 + screenBound.y;
    const windowXPos =
      screenBound.width / 2 - COMMNAND_WINDOW_BOUND.width / 2 + screenBound.x;

    const browserWindow = new BrowserWindow({
      show: false, // Use the 'ready-to-show' event to show the instantiated BrowserWindow.
      modal: true,
      frame: false,
      x: windowXPos,
      y: windowYPos,
      type: 'toolbar',
      resizable: false,
      skipTaskbar: true,
      transparent: true,
      minimizable: false,
      maximizable: false,
      ...COMMNAND_WINDOW_BOUND,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        nodeIntegrationInSubFrames: true,
        sandbox: true, // Sandbox disabled because the demo of preload script depend on the Node.js api
        webviewTag: false, // The webview tag is not recommended. Consider alternatives like an iframe or Electron's BrowserView. @see https://www.electronjs.org/docs/latest/api/webview-tag#warning
        preload: join(app.getAppPath(), 'packages/preload/dist/index.mjs'),
      },
    });

    const frameFirstLoad = new Set<number>();
    const { mainFrame } = browserWindow.webContents;

    browserWindow.webContents.on('frame-created', (event, { frame }) => {
      if (
        frame === mainFrame ||
        (frame.parent === mainFrame &&
          frame.url.startsWith(CUSTOM_SCHEME.extension))
      )
        return;

      event.preventDefault();
    });
    browserWindow.webContents.on('will-frame-navigate', (event) => {
      if (event.frame === mainFrame) return;
      if (
        event.url.startsWith(CUSTOM_SCHEME.extension) &&
        !frameFirstLoad.has(event.frame.frameTreeNodeId) &&
        event.frame.parent === mainFrame
      ) {
        frameFirstLoad.add(event.frame.frameTreeNodeId);
        return;
      }

      event.preventDefault();
    });

    browserWindow.on('ready-to-show', () => {
      browserWindow.webContents.openDevTools({ mode: 'undocked' });
    });

    /**
     * Load the main page of the main window.
     */
    if (
      import.meta.env.DEV &&
      import.meta.env.VITE_DEV_SERVER_URL !== undefined
    ) {
      /**
       * Load from the Vite dev server for development.
       */
      await browserWindow.loadURL(import.meta.env.VITE_DEV_SERVER_URL);
    } else {
      /**
       * Load from the local file system for production and test.
       *
       * Use BrowserWindow.loadFile() instead of BrowserWindow.loadURL() for WhatWG URL API limitations
       * when path contains special characters like `#`.
       * Let electron handle the path quirks.
       * @see https://github.com/nodejs/node/issues/12682
       * @see https://github.com/electron/electron/issues/6869
       */
      await browserWindow.loadFile(
        fileURLToPath(
          new URL('./../../renderer/dist/index.html', import.meta.url),
        ),
      );
    }

    this.browserWindow = browserWindow;

    return browserWindow;
  }

  toggleWindow(showWindow?: boolean) {
    if (!this.browserWindow) return;

    const isHidden = WindowsManager.instance.isWindowHidden('command');
    if ((!isHidden && showWindow !== true) || showWindow === false) {
      this.browserWindow.minimize();
      this.browserWindow.hide();
      return;
    }

    const cursorPosition = screen.getCursorScreenPoint();
    const display = screen.getDisplayNearestPoint(cursorPosition);

    centerWindow(this.browserWindow, display, {
      width: COMMNAND_WINDOW_BOUND.width,
      height: COMMNAND_WINDOW_BOUND.maxHeight,
    });

    if (showWindow || isHidden) {
      this.browserWindow.moveTop();
      this.browserWindow.show();
      this.browserWindow.setBounds({ width: COMMNAND_WINDOW_BOUND.width });
    }
  }
}

export default WindowCommand;
