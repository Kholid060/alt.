/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/ban-types */

export interface ElectronMessagePortPolyfill {
  addListener(event: 'close', listener: Function): this;
  removeListener(event: 'close', listener: Function): this;

  addListener(
    event: 'message',
    listener: (messageEvent: MessageEvent) => void,
  ): this;
  removeListener(
    event: 'message',
    listener: (messageEvent: MessageEvent) => void,
  ): this;

  close(): void;
  postMessage(message: any, transfer?: any[]): void;
  start(): void;
}
