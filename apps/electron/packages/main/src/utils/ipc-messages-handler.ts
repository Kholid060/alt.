import { ipcMain } from 'electron';
import type { IPCEvents } from '#common/interface/ipc-events';
import type { ExtensionCommand, ExtensionManifest } from '@repo/command-api';

function onIpcMessage<T extends keyof IPCEvents>(name: T, callback: IPCEvents[T]) {
  // @ts-expect-error take all the params
  ipcMain.handle(name, (_, ...args) => callback(...args));
}

onIpcMessage('extension:list', () => {
  const commands: ExtensionCommand[] = [
    { context: '', name: 'amp', title: 'Some command', type: 'action', icon: 'icon:Command' },
  ];

  const extensions: ExtensionManifest[] = [
    { title: 'Hello world', commands, description: 'Something amazing', icon: 'icon:File', name: 'hello-world' },
  ];

  return extensions;
});
