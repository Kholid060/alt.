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

export class MessagePortRenderer<AsyncT, SyncT> {
  private port: MessagePort | null = null;

  eventSync: BetterMessagePortSync<SyncT>;
  eventAsync: BetterMessagePortAsync<AsyncT>;

  constructor() {
    this.onMessage = this.onMessage.bind(this);
    this.eventSync = new BetterMessagePortSync(this.postMessage.bind(this));
    this.eventAsync = new BetterMessagePortAsync(this.postMessage.bind(this), {
      eventTimeoutMs: EXTENSION_MESSAGE_PORT_EVENT_TIMEOUT_MS,
    });
  }

  get hasPort() {
    return Boolean(this.port);
  }

  private postMessage(data: unknown) {
    if (!this.port) return;

    this.port.postMessage(data);
  }

  private onMessage({ data }: MessageEvent) {
    if (data?.type === 'send' && data.isSync) {
      this.eventSync.messageHandler(data);
    } else {
      this.eventAsync.messageHandler(data);
    }
  }

  changePort(port: MessagePort) {
    this.destroyPort();

    this.port = port;
    this.port.addEventListener('message', this.onMessage);

    port.start();
  }

  private destroyPort() {
    if (!this.port) return;

    this.port.removeEventListener('message', this.onMessage);
    this.port.close();
  }
}
