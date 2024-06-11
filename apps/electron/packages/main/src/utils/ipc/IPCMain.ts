import {
  CustomError,
  ExtensionError,
  ValidationError,
} from '#packages/common/errors/custom-errors';
import type {
  IPCEvents,
  IPCEventError,
  IPCMainSendEvent,
} from '#packages/common/interface/ipc-events.interface';
import { ipcMain } from 'electron';
import { logger } from '/@/lib/log';

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

        logger('error', ['IPCMainHandle', name], error);

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

  static off<T extends keyof IPCMainSendEvent>(
    name: T,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    callback: (...args: any[]) => void,
  ) {
    ipcMain.off(name, callback);
  }
}

export default IPCMain;
