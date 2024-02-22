import { ipcRenderer } from 'electron';
import type { IPCEvents } from '#common/interface/ipc-events';

export const sendIpcMessage = <T extends keyof IPCEvents, K extends IPCEvents[T] = IPCEvents[T]>(
  name: T,
  ...args: Parameters<K>
) => ipcRenderer.invoke(name, ...args) as Promise<ReturnType<K>>;
;
