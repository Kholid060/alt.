import { ipcRenderer } from 'electron';
import type {
  IPCEventError,
  IPCEvents,
  IPCSendEvents,
} from '../interface/ipc-events.interface';

export const invokeIpcMessage = <
  T extends keyof IPCEvents,
  K extends IPCEvents[T] = IPCEvents[T],
>(
  name: T,
  ...args: Parameters<K>
) =>
  ipcRenderer.invoke(name, ...args) as Promise<ReturnType<K> | IPCEventError>;

function ipcMessageListener(type: 'on' | 'off') {
  return <T extends keyof IPCSendEvents>(
    name: T,
    listener: (
      event: Electron.IpcRendererEvent,
      ...args: IPCSendEvents[T]
    ) => void,
  ) => {
    ipcRenderer[type](name, listener as () => void);
  };
}

export const ipcMessage = {
  on: ipcMessageListener('on'),
  off: ipcMessageListener('off'),
};
