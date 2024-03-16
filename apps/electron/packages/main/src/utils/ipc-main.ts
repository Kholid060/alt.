import type {
  IPCEvents,
  IPCEventError,
  IPCSendEvents,
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
  ipcMain.handle(name, async (event, ...args) =>
    callback(event, ...(args as P)),
  );
}

export function sendIpcMessageToWindow(window: BrowserWindow) {
  return <T extends keyof IPCSendEvents>(
    name: T,
    ...args: IPCSendEvents[T]
  ) => {
    window.webContents.send(name, args);
  };
}
