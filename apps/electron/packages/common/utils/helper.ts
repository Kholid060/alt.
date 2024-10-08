/* eslint-disable @typescript-eslint/no-explicit-any */
import { isObject } from '@altdot/shared';
import type { IPCEventError } from '../interface/ipc-events.interface';
import { ExtensionConfig } from '@altdot/extension/dist/extension-manifest';
import { AppTheme } from '../interface/app.interface';

export function requireInputConfig(config?: ExtensionConfig[]) {
  if (!config) return false;

  return config.some((item) => item.required);
}

export function arrayObjSorter<T extends Record<any, any>[]>({
  key,
  data,
  getItem,
  order = 'asc',
}: {
  data: T;
  key: keyof T[number];
  order?: 'asc' | 'desc';
  getItem?: (item: T[number]) => any;
}) {
  const copyData = data.slice();
  const hasItemGetter = typeof getItem === 'function';

  return copyData.sort((a, b) => {
    let comparison = 0;

    const itemA = hasItemGetter ? getItem(a) : a[key];
    const itemB = hasItemGetter ? getItem(b) : b[key];

    if (itemA > itemB) {
      comparison = 1;
    } else if (itemA < itemB) {
      comparison = -1;
    }

    return order === 'desc' ? comparison * -1 : comparison;
  }) as T;
}

export function debugLog(...args: unknown[]) {
  if (!import.meta.env.DEV) return;

  console.log('[DEBUG]', ...args);
}

export function isIPCEventError(result: unknown): result is IPCEventError {
  return (
    Boolean(result) &&
    isObject(result) &&
    '$isError' in result &&
    (result.$isError as boolean)
  );
}

export function applyTheme(
  theme: AppTheme,
  element = document.documentElement,
) {
  let isDark = theme === 'dark';
  if (theme === 'system') {
    isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  element.classList.toggle('dark', isDark);
}
