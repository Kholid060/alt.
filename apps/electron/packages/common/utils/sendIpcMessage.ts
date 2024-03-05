import { ipcRenderer } from 'electron';
import type {
  IPCEventError,
  IPCEvents,
} from '../interface/ipc-events.interface';

export const sendIpcMessage = <
  T extends keyof IPCEvents,
  K extends IPCEvents[T] = IPCEvents[T],
>(
  name: T,
  ...args: Parameters<K>
) =>
  ipcRenderer.invoke(name, ...args) as Promise<ReturnType<K> | IPCEventError>;
