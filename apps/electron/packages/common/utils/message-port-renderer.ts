import { BetterMessagePortAsync, BetterMessagePortSync } from '@altdot/shared';
import type { MessagePortChannelIds } from '../interface/message-port-events.interface';
import { EXTENSION_MESSAGE_PORT_EVENT_TIMEOUT_MS } from './constant/extension.const';

export class MessagePortListener {
  static on(
    channelId: MessagePortChannelIds,
    listener: (event: MessageEvent) => void,
  ) {
    //@ts-expect-error The event is MessageEvent dispatched by preload
    window.addEventListener(channelId, listener);

    return () => this.off(channelId, listener);
  }

  static off(
    channelId: MessagePortChannelIds,
    listener: (event: MessageEvent) => void,
  ) {
    //@ts-expect-error ...
    window.removeEventListener(channelId, listener);
  }
}

type PortType = 'view' | 'action';

export class MessagePortRenderer<AsyncT, SyncT> {
  private viewPort: MessagePort | null = null;
  private actionPort: MessagePort | null = null;

  eventSync: BetterMessagePortSync<SyncT>;
  eventAsync: BetterMessagePortAsync<AsyncT>;

  constructor() {
    this.onMessage = this.onMessage.bind(this);
    this.eventSync = new BetterMessagePortSync(this.postMessage.bind(this));
    this.eventAsync = new BetterMessagePortAsync(this.postMessage.bind(this), {
      eventTimeoutMs: EXTENSION_MESSAGE_PORT_EVENT_TIMEOUT_MS,
    });
  }

  hasPort(type: PortType) {
    return Boolean(type === 'action' ? this.actionPort : this.viewPort);
  }

  private postMessage(data: unknown) {
    this.viewPort?.postMessage(data);
    this.actionPort?.postMessage(data);
  }

  private onMessage({ data }: MessageEvent) {
    if (data?.type === 'send' && data.isSync) {
      this.eventSync.messageHandler(data);
    } else {
      this.eventAsync.messageHandler(data);
    }
  }

  changePort(type: PortType, port: MessagePort) {
    this.destroyPort(type);

    if (type === 'action') this.actionPort = port;
    else this.viewPort = port;

    port.addEventListener('message', this.onMessage);
    port.start();
  }

  destroyPort(type: PortType) {
    const port = type === 'action' ? this.actionPort : this.viewPort;
    if (!port) return;

    port.removeEventListener('message', this.onMessage);
    port.close();
  }
}
