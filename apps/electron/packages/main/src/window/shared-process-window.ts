import { BrowserWindow } from 'electron';
import { fileURLToPath } from 'node:url';
import type WindowBase from './WindowBase';
import WindowUtils from './WindowUtils';

class WindowSharedProcess extends WindowUtils implements WindowBase {
  private static _instance: WindowSharedProcess | null = null;

  static get instance() {
    return this._instance || (this._instance = new WindowSharedProcess());
  }

  constructor() {
    super('dashboard');
  }

  async createWindow(): Promise<Electron.BrowserWindow> {
    const browserWindow = new BrowserWindow({
      show: false, // Use the 'ready-to-show' event to show the instantiated BrowserWindow.
      webPreferences: {
        contextIsolation: false,
        nodeIntegration: true,
        webviewTag: false, // The webview tag is not recommended. Consider alternatives like an iframe or Electron's BrowserView. @see https://www.electronjs.org/docs/latest/api/webview-tag#warning
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
      if (!import.meta.env.DEV) return;

      browserWindow.webContents.openDevTools({ mode: 'detach' });
    });

    await browserWindow.loadFile(
      fileURLToPath(new URL('./../../shared/dist/index.html', import.meta.url)),
    );

    return browserWindow;
  }
}

export default WindowSharedProcess;
