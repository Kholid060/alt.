import type { ExtensionConfig } from '@repo/extension-core';

export function requireInputConfig(config?: ExtensionConfig[]) {
  if (!config) return false;

  return config.some((item) => item.required);
}
