/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
  PossibleTypes,
  PossibleTypesTypeMap,
} from '../interface/common.interface';
import { NodeInvalidType } from './custom-errors';

export function getExactType(data: unknown) {
  return Object.prototype.toString.call(data).slice(8, -1) as PossibleTypes;
}

export function isValidType<T extends PossibleTypes[]>(
  value: unknown,
  expectedType: T,
  throwError = false,
): value is PossibleTypesTypeMap[T[number]] {
  const valType = getExactType(value);
  const isValid = !expectedType.some((type) => valType !== type);

  if (!isValid && throwError) {
    throw new NodeInvalidType(valType, expectedType);
  }

  return isValid;
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
