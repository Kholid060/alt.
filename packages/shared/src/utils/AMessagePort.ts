import { EventEmitter } from 'eventemitter3';

interface AMessagePortEvents {}

class AMessagePort<
  T extends AMessagePortEvents = AMessagePortEvents,
> extends EventEmitter<T> {
  port: MessagePort;

  constructor(port: MessagePort) {
    super();
    this.port = port;

    this.port.addEventListener('message', this._messageHandler.bind(this));
    this.port.start();
  }

  private _messageHandler(
    event: MessageEvent<{ name: unknown; data: unknown }>,
  ) {
    if (
      typeof event.data !== 'object' ||
      Array.isArray(event.data) ||
      !Array.isArray(event.data.data) ||
      !event.data.name
    )
      return;

    // @ts-expect-error expected!!!
    this.emit(event.data.name, ...event.data.data);
  }

  sendMessage<K extends EventEmitter.EventNames<T>>(
    name: K,
    ...data: EventEmitter.EventArgs<T, K>
  ) {
    this.port.postMessage({ data, name });
  }

  destroy() {
    this.removeAllListeners();
    this.port.removeEventListener('message', this._messageHandler);
    this.port.close();
  }
}

export default AMessagePort;