import { BetterMessagePortSync } from './BetterMessagePort';
import type { MessagePortChannelIds } from '../interface/message-port-events.interface';

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

export class MessagePortRenderer<T> {
  private port: MessagePort | null = null;

  event: BetterMessagePortSync<T>;

  constructor() {
    this.onMessage = this.onMessage.bind(this);
    this.event = new BetterMessagePortSync(this.postMessage.bind(this));
  }

  get hasPort() {
    return Boolean(this.port);
  }

  private postMessage(data: unknown) {
    if (!this.port) return;

    this.port.postMessage(data);
  }

  private onMessage(event: MessageEvent) {
    this.event.messageHandler(event.data);
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
