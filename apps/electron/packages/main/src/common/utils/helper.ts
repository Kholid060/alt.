import type { ExtensionConfig } from '@altdot/extension';
import { WSAckErrorResult, isObject } from '@altdot/shared';
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

interface CenterWindowOptions {
  width?: number;
  height?: number;
  offsetX?: number;
  offsetY?: number;
}
export function centerWindow(
  window: BrowserWindow,
  display: Display,
  { height, offsetX, offsetY, width }: CenterWindowOptions = {},
) {
  const windowBounds = window.getBounds();
  const displayBound = display.bounds;

  const windowYPos = displayBound.height * 0.225 + displayBound.y;
  const windowXPos =
    displayBound.width / 2 - windowBounds.width / 2 + displayBound.x;

  window.setBounds({
    width,
    height,
    x: Math.floor(windowXPos - (offsetX ?? 0)),
    y: Math.floor(windowYPos - (offsetY ?? 0)),
  });
}

export function isWSAckError(result: unknown): result is WSAckErrorResult {
  return Boolean(result) && isObject(result) && 'error' in result;
}
