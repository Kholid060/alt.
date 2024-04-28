import { ipcRenderer } from 'electron';
import { IPC_ON_EVENT } from './constant/constant';

class MessagePortRenderer<EventMap> {
  private ports: Map<string, MessagePort> = new Map();

  constructor() {
    this._onMessagePortCreated = this._onMessagePortCreated.bind(this);

    ipcRenderer.on(
      IPC_ON_EVENT.createMessagePortMain,
      this._onMessagePortCreated,
    );
  }

  private _onMessagePortCreated(
    { ports }: Electron.IpcRendererEvent,
    channelId: string,
  ) {
    if (ports.length === 0 || typeof channelId !== 'string') return;

    this.ports.set(channelId, ports[0]);
  }

  postMessage<T extends keyof EventMap, E extends keyof EventMap[T]>(
    channelId: T,
    eventName: E,
    data: EventMap[T][E],
  ) {
    const port = this.ports.get(channelId as string);
    if (!port) return;

    port.postMessage({
      name: eventName,
      data,
    });
  }
}

export default MessagePortRenderer;
