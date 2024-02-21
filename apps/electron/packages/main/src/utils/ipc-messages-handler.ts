import { ipcMain } from 'electron';
import type { IPCEvents } from '#common/interface/ipc-events';
import type { ExtensionCommand, ExtensionManifest } from '@repo/command-api';
import InstalledApps from './InstalledApps';

function onIpcMessage<T extends keyof IPCEvents>(
  name: T,
  callback: (...args: Parameters<IPCEvents[T]>) => Promise<ReturnType<IPCEvents[T]>>,
) {
  ipcMain.handle(name, (_, ...args) => callback(...args as Parameters<IPCEvents[T]>));
}

onIpcMessage('extension:list', () => {
  const commands: ExtensionCommand[] = [
    { context: '', name: 'amp', title: 'Some command', type: 'action', icon: 'icon:Command' },
  ];

  const extensions: ExtensionManifest[] = [
    { title: 'Hello world', commands, description: 'Something amazing', icon: 'icon:File', name: 'hello-world' },
  ];

  return Promise.resolve(extensions);
});

onIpcMessage('apps:get-list', () => InstalledApps.instance.getList());

