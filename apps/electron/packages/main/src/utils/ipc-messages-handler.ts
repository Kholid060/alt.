import { ipcMain } from 'electron';
import type { IPCEvents } from '#common/interface/ipc-events';
import InstalledApps from './InstalledApps';
import ExtensionLoader from './extension/ExtensionLoader';

function onIpcMessage<T extends keyof IPCEvents>(
  name: T,
  callback: (...args: Parameters<IPCEvents[T]>) => Promise<ReturnType<IPCEvents[T]>>,
) {
  ipcMain.handle(name, (_, ...args) => callback(...args as Parameters<IPCEvents[T]>));
}

onIpcMessage('extension:list', () => Promise.resolve(ExtensionLoader.instance.getExtensions()));

onIpcMessage('apps:get-list', () => InstalledApps.instance.getList());

