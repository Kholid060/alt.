import type { ExtensionConfig } from '@repo/extension-core';
import { isObject } from '@repo/shared';
import type { IPCEventError } from 'interface/ipc-events.interface';

export function isIPCEventError(result: unknown): result is IPCEventError {
  return Boolean(result) && isObject(result) && '$isError' in result;
}

export function requireInputConfig(config?: ExtensionConfig[]) {
  if (!config) return false;

  return config.some((item) => item.required);
}
