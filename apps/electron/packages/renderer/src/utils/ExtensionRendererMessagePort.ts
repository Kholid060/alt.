import { IPCPostMessageEventMainToRenderer } from '#packages/common/interface/ipc-events.interface';
import { EXTENSION_MESSAGE_PORT_EVENT_TIMEOUT_MS } from '#packages/common/utils/constant/extension.const';
import { BetterMessagePortAsync, BetterMessagePortSync } from '@altdot/shared';

export class MessagePortListener {
  static on<T extends keyof IPCPostMessageEventMainToRenderer>(
    name: T,
    callback: (
      event: MessageEvent<IPCPostMessageEventMainToRenderer[T][0]>,
    ) => void,
  ) {
    //@ts-expect-error The event is MessageEvent dispatched by preload
    window.addEventListener(name, callback);

    return () => this.off(name, callback);
  }

  static off<T extends keyof IPCPostMessageEventMainToRenderer>(
    name: T,
    callback: (
      event: MessageEvent<IPCPostMessageEventMainToRenderer[T][0]>,
    ) => void,
  ) {
    //@ts-expect-error CUSTOM EVENT!!!
    window.removeEventListener(name, callback);
  }
}

export class ExtensionRendererMessagePort<AsyncT, SyncT> {
  private ports: Map<string, MessagePort> = new Map();

  eventSync: BetterMessagePortSync<SyncT>;
  eventAsync: BetterMessagePortAsync<AsyncT>;

  constructor() {
    this.onMessage = this.onMessage.bind(this);
    this.eventSync = new BetterMessagePortSync(this.postMessage.bind(this));
    this.eventAsync = new BetterMessagePortAsync(this.postMessage.bind(this), {
      eventTimeoutMs: EXTENSION_MESSAGE_PORT_EVENT_TIMEOUT_MS,
    });
  }

  hasPort(id: string) {
    return this.ports.has(id);
  }

  private postMessage(data: unknown) {
    this.ports.forEach((port) => {
      port.postMessage(data);
    });
  }

  private onMessage({ data }: MessageEvent) {
    if (data?.type === 'send' && data.isSync) {
      this.eventSync.messageHandler(data);
    } else {
      this.eventAsync.messageHandler(data);
    }
  }

  addPort(id: string, port: MessagePort) {
    if (this.ports.has(id)) this.destroyPort(id);

    this.ports.set(id, port);

    port.addEventListener('message', this.onMessage);
    port.start();
  }

  destroyPort(id: string) {
    const port = this.ports.get(id);
    if (!port) return;

    this.ports.delete(id);

    port.removeEventListener('message', this.onMessage);
    port.close();
  }
}
