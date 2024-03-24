import type { ExtensionConfig } from '@repo/extension-core';

export function getExtensionConfigDefaultValue(config: ExtensionConfig[]): {
  requireInput: boolean;
  defaultValues: Record<string, unknown>;
} {
  if (config.length === 0) return { requireInput: false, defaultValues: {} };

  const requiredItem = config.some((item) => item.required);
  if (requiredItem) return { requireInput: true, defaultValues: {} };

  const defaultValues: Record<string, unknown> = {};
  config.forEach((item) => {
    if (!Object.hasOwn(item, 'defaultValue')) return;

    defaultValues[item.name] = item.defaultValue;
  });

  return { defaultValues, requireInput: false };
}
