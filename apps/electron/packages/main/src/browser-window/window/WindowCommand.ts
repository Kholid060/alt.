import { CUSTOM_SCHEME } from '#common/utils/constant/constant';
import { app, screen } from 'electron';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import WindowBase, { WindowBaseState } from './WindowBase';
import { sleep } from '@altdot/shared';
import { centerWindow } from '/@/common/utils/helper';
import { LoggerService } from '/@/logger/logger.service';

export const COMMNAND_WINDOW_BOUND = {
  width: 650,
  maxWidth: 650,
  minHeight: 400,
  maxHeight: 600,
} as const;

function windowInitialPos() {
  const cursorPos = screen.getCursorScreenPoint();
  const activeScreen = screen.getDisplayNearestPoint(cursorPos);

  const screenBound = activeScreen.bounds;

  return {
    y: screenBound.height * 0.225 + screenBound.y,
    x: screenBound.width / 2 - COMMNAND_WINDOW_BOUND.width / 2 + screenBound.x,
  };
}
class WindowCommand extends WindowBase {
  private lastDisplayId: number | null = null;

  constructor(private logger: LoggerService) {
    super('command', {
      show: false, // Use the 'ready-to-show' event to show the instantiated BrowserWindow.
      frame: false,
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
        sandbox: true,
        webviewTag: false,
        preload: join(app.getAppPath(), 'packages/preload/dist/index.mjs'),
      },
    });

    this.init();
  }

  init() {
    this.hook('window:created', async (browserWindow) => {
      try {
        const frameFirstLoad = new Set<number>();
        const { mainFrame } = browserWindow.webContents;

        browserWindow.setBounds(windowInitialPos());

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

        if (import.meta.env.DEV) {
          browserWindow.on('ready-to-show', () => {
            browserWindow.webContents.openDevTools({ mode: 'undocked' });
          });
        }

        browserWindow.webContents.session.webRequest.onBeforeSendHeaders(
          (details, callback) => {
            if (details.frame?.url.startsWith(CUSTOM_SCHEME.extension)) {
              details.requestHeaders['Origin'] = details.frame.url;
              details.requestHeaders['Access-Control-Allow-Origin'] = '*';
              callback({
                cancel: false,
                requestHeaders: details.requestHeaders,
              });
            } else {
              callback({ requestHeaders: details.requestHeaders });
            }
          },
        );
        browserWindow.webContents.session.webRequest.onHeadersReceived(
          ({ responseHeaders, frame, statusLine, method }, callback) => {
            if (frame?.url.startsWith(CUSTOM_SCHEME.extension)) {
              callback({
                statusLine: method === 'OPTIONS' ? 'HTTP/1.1 200' : statusLine,
                responseHeaders: {
                  ...(responseHeaders ?? {}),
                  'access-control-allow-origin': '*',
                  'access-control-allow-headers': '*',
                },
              });
            } else {
              callback({ responseHeaders, statusLine });
            }
          },
        );

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
          await browserWindow.loadFile('packages/renderer/dist/index.html');
        }
      } catch (error) {
        this.logger.error(['WindowCommand', 'create hook'], error);
      }
    });
  }

  async toggleWindow(showWindow?: boolean) {
    let browserWindow = this.window;
    if (!browserWindow) {
      if (showWindow) browserWindow = await this.createWindow();
      else return;
    }

    const isHidden = this.state === WindowBaseState.Hidden;
    if ((!isHidden && showWindow !== true) || showWindow === false) {
      browserWindow?.minimize();
      browserWindow?.hide();
      return;
    }

    const cursorPosition = screen.getCursorScreenPoint();
    const display = screen.getDisplayNearestPoint(cursorPosition);

    if (browserWindow && display.id !== this.lastDisplayId) {
      centerWindow(browserWindow, display, {
        width: COMMNAND_WINDOW_BOUND.width,
        height: COMMNAND_WINDOW_BOUND.maxHeight,
      });
      this.lastDisplayId = display.id;
    }

    if (browserWindow && (showWindow || isHidden)) {
      browserWindow.moveTop();
      browserWindow.show();
      browserWindow.setBounds({ width: COMMNAND_WINDOW_BOUND.width });
    }
  }

  async tempHideWindow<
    T extends (...args: unknown[]) => unknown | Promise<unknown>,
  >(callback: T) {
    const hiddenState = this.state === WindowBaseState.Hidden;

    try {
      if (this.window && !hiddenState) {
        this.window.minimize();
        this.window.hide();
      }

      const result = await callback();

      return result as ReturnType<T>;
    } catch (error) {
      this.logger.error(['WindowCommand', 'tempHideWindow'], error);
      throw error;
    } finally {
      if (this.window && !hiddenState) {
        this.window.moveTop();
        this.window.show();
        this.window.focus();

        await sleep(250);
      }
    }
  }
}

export default WindowCommand;
