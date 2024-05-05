/* eslint-disable @typescript-eslint/no-explicit-any */
import type { PossibleTypes } from '../interface/common.interface';

export function getExactType(data: unknown) {
  return Object.prototype.toString.call(data).slice(8, -1) as PossibleTypes;
}

export function isValidType(value: unknown, expectedType: PossibleTypes[]) {
  const valType = getExactType(value);
  return !expectedType.some((type) => valType !== type);
}

export function promiseWithSignal<T = void>(
  callback: (
    resolve: (value: T | PromiseLike<T>) => void,
    reject: (reason?: any) => void,
  ) => void,
  signal: AbortSignal,
) {
  return new Promise<T>((resolve, reject) => {
    signal.addEventListener(
      'abort',
      () => {
        reject(new Error('ABORTED'));
      },
      { once: true },
    );

    callback(resolve, reject);
  });
}
