import { app, dialog } from 'electron';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import WindowBase from './WindowBase';

class WindowDashboard extends WindowBase {
  constructor() {
    super('dashboard', {
      show: false, // Use the 'ready-to-show' event to show the instantiated BrowserWindow.
      minWidth: 1000,
      minHeight: 650,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true, // Sandbox disabled because the demo of preload script depend on the Node.js api
        webviewTag: false, // The webview tag is not recommended. Consider alternatives like an iframe or Electron's BrowserView. @see https://www.electronjs.org/docs/latest/api/webview-tag#warning
        preload: join(app.getAppPath(), 'packages/preload/dist/index.mjs'),
      },
    });

    this.init();
  }

  private init() {
    this.hook('window:created', async (browserWindow) => {
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
          browserWindow?.webContents.openDevTools({ mode: 'right' });
        }
      });
      browserWindow.on('close', async (event) => {
        const url = browserWindow.webContents.getURL();
        if (!url.includes('preventCloseWindow=true')) return;

        const choice = dialog.showMessageBoxSync(browserWindow, {
          type: 'question',
          buttons: ['Close', 'Cancel'],
          title: 'Close window?',
          message: 'Changes you made may not be saved.',
        });
        if (choice > 0) event.preventDefault();
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
        const url = new URL('/dashboard', import.meta.env.VITE_DEV_SERVER_URL);
        await browserWindow.loadURL(url.href);
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
            new URL('./../../renderer/dist/dashboard.html', import.meta.url),
          ),
        );
      }
    });
  }
}

export default WindowDashboard;
