import type { IPCEventError } from '#packages/common/interface/ipc-events.interface';
import { isObject } from '@repo/shared';

export function isIPCEventError(result: unknown): result is IPCEventError {
  return Boolean(result) && isObject(result) && '$isError' in result;
}
