/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/ban-types */

type FunctionType = (...args: any[]) => any;

export interface ElectronMessageEvent {
  data: any;
  ports: ElectronMessagePortPolyfill[];
}

export interface ElectronMessagePortPolyfill {
  addListener(event: 'close', listener: FunctionType): any;
  removeListener(event: 'close', listener: FunctionType): any;

  addListener(
    event: 'message',
    listener: (messageEvent: ElectronMessageEvent) => void,
  ): any;
  removeListener(
    event: 'message',
    listener: (messageEvent: ElectronMessageEvent) => void,
  ): any;

  close(): void;
  postMessage(message: any, transfer?: any[]): void;
  start(): void;
}
