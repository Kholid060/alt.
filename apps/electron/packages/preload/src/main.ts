import {
  IPC_ON_EVENT,
  IPC_POST_MESSAGE_EVENT,
} from '#common/utils/constant/constant';
import { ipcRenderer } from 'electron';

export {
  invokeIpcMessage,
  ipcMessage,
  sendIpcMessage,
} from '../../common/utils/ipc-renderer';

export function createMainMessagePort(eventId: string) {
  ipcRenderer.send(IPC_ON_EVENT.createExtensionPort);

  ipcRenderer.once(IPC_POST_MESSAGE_EVENT.extensionPortCreated, (message) => {
    const messageEvent = new MessageEvent(eventId, {
      ports: message.ports,
    });
    window.dispatchEvent(messageEvent);
  });
}

export function deleteMainMessagePort() {
  ipcRenderer.send(IPC_ON_EVENT.deleteExtensionPort);
}
