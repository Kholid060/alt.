/* eslint-disable @typescript-eslint/no-explicit-any */

export declare namespace Events {
  interface Event<T extends (...args: any[]) => any> {
    removeListener(callback: T): void;
    addListener(callback: T): () => void;
  }
}
