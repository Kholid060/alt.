import {
  CustomError,
  ExtensionError,
  ValidationError,
} from '#packages/common/errors/custom-errors';
import type {
  IPCEvents,
  IPCEventError,
  IPCRendererSendEvent,
  IPCMainSendEvent,
} from '#packages/common/interface/ipc-events.interface';
import type { BrowserWindow } from 'electron';
import { ipcMain } from 'electron';
import type { WindowManagerWindowNames } from '/@/window/WindowsManager';
import WindowsManager from '/@/window/WindowsManager';

class IPCMain {
  static handle<T extends keyof IPCEvents, P extends Parameters<IPCEvents[T]>>(
    name: T,
    callback: (
      ...args: [Electron.IpcMainInvokeEvent, ...P]
    ) => Promise<ReturnType<IPCEvents[T]> | IPCEventError>,
  ) {
    ipcMain.handle(name, async (event, ...args) => {
      try {
        return await callback(event, ...(args as P));
      } catch (error) {
        if (
          error instanceof CustomError ||
          error instanceof ExtensionError ||
          error instanceof ValidationError
        ) {
          return {
            $isError: true,
            message: (error as Error).message,
          };
        }

        throw error;
      }
    });
  }

  static on<T extends keyof IPCMainSendEvent>(
    name: T,
    callback: (
      ...args: [event: Electron.IpcMainEvent, ...IPCMainSendEvent[T]]
    ) => void,
  ) {
    ipcMain.on(name, callback);
  }

  static sendToWindow<T extends keyof IPCRendererSendEvent>(
    window: BrowserWindow | WindowManagerWindowNames,
    name: T,
    ...args: IPCRendererSendEvent[T]
  ) {
    const browserWindow =
      typeof window === 'string'
        ? WindowsManager.instance.getWindow(window)
        : window;
    browserWindow.webContents.send(name, ...args);
  }
}

export default IPCMain;
