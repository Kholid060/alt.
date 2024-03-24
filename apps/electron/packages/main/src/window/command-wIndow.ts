import { CUSTOM_SCHEME } from '#common/utils/constant/constant';
import { BrowserWindow, app, screen } from 'electron';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const COMMNAND_WINDOW_BOUND = {
  width: 650,
  minHeight: 300,
} as const;

export async function createCommandWindow() {
  const cursorPos = screen.getCursorScreenPoint();
  const activeScreen = screen.getDisplayNearestPoint(cursorPos);

  const screenBound = activeScreen.bounds;

  const windowYPos = screenBound.height * 0.225 + screenBound.y;
  const windowXPos =
    screenBound.width / 2 - COMMNAND_WINDOW_BOUND.width / 2 + screenBound.x;

  const browserWindow = new BrowserWindow({
    show: false, // Use the 'ready-to-show' event to show the instantiated BrowserWindow.
    frame: false,
    x: windowXPos,
    y: windowYPos,
    transparent: true,
    resizable: import.meta.env.DEV,
    width: COMMNAND_WINDOW_BOUND.width,
    minHeight: COMMNAND_WINDOW_BOUND.minHeight,
    alwaysOnTop: !import.meta.env.DEV,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      nodeIntegrationInSubFrames: true,
      sandbox: true, // Sandbox disabled because the demo of preload script depend on the Node.js api
      webviewTag: false, // The webview tag is not recommended. Consider alternatives like an iframe or Electron's BrowserView. @see https://www.electronjs.org/docs/latest/api/webview-tag#warning
      preload: join(app.getAppPath(), 'packages/preload/dist/index.mjs'),
    },
  });

  /**
   * If the 'show' property of the BrowserWindow's constructor is omitted from the initialization options,
   * it then defaults to 'true'. This can cause flickering as the window loads the html content,
   * and it also has show problematic behaviour with the closing of the window.
   * Use `show: false` and listen to the  `ready-to-show` event to show the window.
   *
   * @see https://github.com/electron/electron/issues/25012 for the afford mentioned issue.
   */
  browserWindow.on('ready-to-show', () => {
    browserWindow?.show();

    if (import.meta.env.DEV) {
      browserWindow?.webContents.openDevTools();
    }
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

/**
 * Restore an existing BrowserWindow or Create a new BrowserWindow.
 */
// export async function restoreOrCreateCommandWindow() {
//   let window = BrowserWindow.getAllWindows().find((w) => !w.isDestroyed());

//   if (window === undefined) {
//     window = await createCommandWindow();
//   }

//   if (window.isMinimized()) {
//     window.restore();
//   }

//   window.focus();
// }
