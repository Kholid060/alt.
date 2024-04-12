import { ipcRenderer } from 'electron';
import type {
  IPCEventError,
  IPCEvents,
  IPCMainSendEvent,
  IPCRendererSendEvent,
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
  return <T extends keyof IPCRendererSendEvent>(
    name: T,
    listener: (
      event: Electron.IpcRendererEvent,
      ...args: IPCRendererSendEvent[T]
    ) => void,
  ) => {
    ipcRenderer[type](name, listener as () => void);

    if (type === 'on') {
      return () => ipcRenderer.off(name, listener as () => void);
    }

    return null;
  };
}

export function sendIpcMessage<T extends keyof IPCMainSendEvent>(
  name: T,
  ...args: IPCMainSendEvent[T]
) {
  ipcRenderer.send(name, ...args);
}

export const ipcMessage = {
  on: ipcMessageListener('on'),
  off: ipcMessageListener('off'),
};
