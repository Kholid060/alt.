import fs from 'fs-extra';
import type { BrowserWindow } from 'electron';
import { fileURLToPath } from 'node:url';
import WindowBase from './WindowBase';
import path from 'node:path';
import { sleep } from '@altdot/shared';

const BASE_DIR = fileURLToPath(new URL('./../../shared/dist', import.meta.url));

const mainJSPath = path.join(BASE_DIR, 'main.js');
async function checkMainJSFile(browserWindow: BrowserWindow) {
  if (fs.existsSync(mainJSPath)) {
    browserWindow.webContents.reload();
    return;
  }

  await sleep(1000);
  checkMainJSFile(browserWindow);
}

class WindowSharedProcess extends WindowBase {
  constructor() {
    super('shared-process', {
      show: false,
      focusable: false,
      webPreferences: {
        webviewTag: false,
        nodeIntegration: true,
        contextIsolation: false,
        nodeIntegrationInWorker: true,
      },
    });

    this.init();
  }

  private init() {
    this.hook('window:created', async (browserWindow) => {
      if (import.meta.env.DEV) {
        browserWindow.on('ready-to-show', () => {
          browserWindow.webContents.openDevTools({ mode: 'detach' });
        });
      }

      const resolver = Promise.withResolvers<void>();
      browserWindow.webContents.once('did-finish-load', resolver.resolve);

      const htmlFilePath = path.join(BASE_DIR, 'index.html');
      await browserWindow.loadFile(htmlFilePath);

      browserWindow.webContents.session.webRequest.onBeforeSendHeaders(
        (details, callback) => {
          if (details.frame?.url)
            details.requestHeaders['Origin'] = details.frame.url;
          details.requestHeaders['Access-Control-Allow-Origin'] = '*';
          callback({
            cancel: false,
            requestHeaders: details.requestHeaders,
          });
        },
      );
      browserWindow.webContents.session.webRequest.onHeadersReceived(
        ({ responseHeaders, statusLine, method }, callback) => {
          callback({
            statusLine: method === 'OPTIONS' ? 'HTTP/1.1 200' : statusLine,
            responseHeaders: {
              ...(responseHeaders ?? {}),
              'access-control-allow-origin': '*',
              'access-control-allow-headers': '*',
            },
          });
        },
      );

      if (import.meta.env.DEV) checkMainJSFile(browserWindow);

      await resolver.promise;
      await sleep(400);
    });
  }
}

export default WindowSharedProcess;
