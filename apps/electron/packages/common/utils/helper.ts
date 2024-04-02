import { isObject } from '@repo/shared';
import type { IPCEventError } from 'interface/ipc-events.interface';

export function isIPCEventError(result: unknown): result is IPCEventError {
  return Boolean(result) && isObject(result) && '$isError' in result;
}
