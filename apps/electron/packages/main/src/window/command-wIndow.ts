import { CUSTOM_SCHEME } from '#common/utils/constant/constant';
import { BrowserWindow, app, screen } from 'electron';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import WindowsManager from './WindowsManager';
import { centerWindow } from '../utils/helper';

export const COMMNAND_WINDOW_BOUND = {
  width: 650,
  maxWidth: 650,
  minHeight: 400,
  maxHeight: 600,
} as const;

export function toggleCommandWindow(showWindow?: boolean) {
  const commandWindow = WindowsManager.instance.getWindow('command', {
    noThrow: true,
  });
  if (!commandWindow) return;

  const isHidden = WindowsManager.instance.isWindowHidden('command');
  if (!isHidden || (typeof showWindow === 'boolean' && showWindow === false)) {
    commandWindow.minimize();
    commandWindow.hide();
    return;
  }

  const cursorPosition = screen.getCursorScreenPoint();
  const display = screen.getDisplayNearestPoint(cursorPosition);

  centerWindow(commandWindow, display, {
    width: COMMNAND_WINDOW_BOUND.width,
    height: COMMNAND_WINDOW_BOUND.maxHeight,
  });

  if (isHidden || showWindow) {
    commandWindow.moveTop();
    commandWindow.show();
    commandWindow.setBounds({ width: COMMNAND_WINDOW_BOUND.width });
  }
}

export async function createCommandWindow() {
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
    alwaysOnTop: true,
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

  // browserWindow.on('ready-to-show', () => {
  //   browserWindow.webContents.openDevTools({ mode: 'undocked' });
  // });

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

  return browserWindow;
}
