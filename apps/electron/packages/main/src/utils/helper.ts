import type { ExtensionConfig } from '@repo/extension-core';
import type { BrowserWindow, Display } from 'electron';

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

export function centerWindow(
  window: BrowserWindow,
  display: Display,
  offset: { x?: number; y?: number } = {},
) {
  const windowBounds = window.getBounds();
  const displayBound = display.bounds;

  const windowYPos = displayBound.height * 0.225 + displayBound.y;
  const windowXPos =
    displayBound.width / 2 - windowBounds.width / 2 + displayBound.x;

  window.setPosition(
    Math.floor(windowXPos - (offset.x ?? 0)),
    Math.floor(windowYPos - (offset.y ?? 0)),
  );
}
