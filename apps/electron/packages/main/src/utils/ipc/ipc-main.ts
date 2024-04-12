import {
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

export function onIpcMessage<
  T extends keyof IPCEvents,
  P extends Parameters<IPCEvents[T]>,
>(
  name: T,
  callback: (
    ...args: [Electron.IpcMainInvokeEvent, ...P]
  ) => Promise<ReturnType<IPCEvents[T]> | IPCEventError>,
) {
  ipcMain.handle(name, async (event, ...args) => {
    try {
      return await callback(event, ...(args as P));
    } catch (error) {
      if (error instanceof ExtensionError || error instanceof ValidationError) {
        return {
          $isError: true,
          message: (error as Error).message,
        };
      }

      throw error;
    }
  });
}

export function sendIpcMessageToWindow(window: BrowserWindow) {
  return <T extends keyof IPCRendererSendEvent>(
    name: T,
    ...args: IPCRendererSendEvent[T]
  ) => {
    window.webContents.send(name, ...args);
  };
}

export function onIpcSendMessage<T extends keyof IPCMainSendEvent>(
  name: T,
  callback: (
    ...args: [event: Electron.IpcMainEvent, ...IPCMainSendEvent[T]]
  ) => void,
) {
  ipcMain.on(name, callback);
}
