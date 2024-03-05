import InstalledApps from './InstalledApps';
import ExtensionLoader from './extension/ExtensionLoader';
import type {
  IPCEventError,
  IPCEvents,
} from '#common/interface/ipc-events.interface';
import './ipc-extension-messages';
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

onIpcMessage('extension:list', () =>
  Promise.resolve(ExtensionLoader.instance.extensions),
);
onIpcMessage('extension:get', (_, extId) =>
  Promise.resolve(ExtensionLoader.instance.getExtension(extId)),
);

onIpcMessage('apps:get-list', () => InstalledApps.instance.getList());
