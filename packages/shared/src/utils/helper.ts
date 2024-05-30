import { KeyboardShortcut } from '../interfaces/keyboard.interface';
import { SHORTCUT_KEY_DISPLAY_MAP } from './constant/shortcut.const';

export function debounce<T extends unknown[]>(
  fn: (...args: T) => void,
  delay: number,
) {
  let timeoutId: ReturnType<typeof setTimeout>;

  return (...args: T) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      fn(...args);
    }, delay);
  };
}

export function createDebounce() {
  let timeout: null | ReturnType<typeof setTimeout> = null;

  return (callback: () => void, timeoutMs: number) => {
    if (timeout !== null) {
      clearTimeout(timeout);
      timeout = setTimeout(callback, timeoutMs);
      return;
    }

    timeout = setTimeout(callback, timeoutMs);
  };
}

export type ThrottledFunction<T extends unknown[]> = (...args: T) => void;
export function throttle<T extends unknown[]>(
  func: (...args: T) => void,
  limit = 1000,
): ThrottledFunction<T> {
  let lastExecutionTime = 0;
  let timeout: number | ReturnType<typeof setTimeout> = -1;

  return function throttledFunc(...args: T): void {
    const now = Date.now();

    if (now - lastExecutionTime < limit) {
      if (timeout) {
        return;
      }

      timeout = setTimeout(
        () => {
          func(...args);
          lastExecutionTime = now;
          timeout = -1;
        },
        limit - (now - lastExecutionTime),
      );
    } else {
      func(...args);
      lastExecutionTime = now;
    }
  };
}

export function parseJSON<T = unknown, K = unknown>(
  input: string,
  def?: K,
): T | K {
  try {
    return JSON.parse(input) as T;
  } catch (_error) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return def;
  }
}

export function isObject(
  input: unknown,
): input is Record<number | string | symbol, unknown> {
  return typeof input === 'object' && !Array.isArray(input) && input !== null;
}

export function sleep(ms = 1000) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

export function getRandomArbitrary(min = 0, max = 10, remainder?: number) {
  let randomInteger = Math.floor(Math.random() * (max - min + 1) + min);

  if (typeof remainder === 'number') {
    const adjustment =
      (remainder - ((randomInteger - min) % remainder)) % remainder;
    randomInteger += adjustment;
  }

  return randomInteger;
}

export function getRandomItemFromArr<T>(array: T[]): T {
  const randomIndex = Math.floor(Math.random() * array.length);

  return array[randomIndex];
}

export function shuffleArray<T>(array: T[]): T[] {
  let currentIndex: number = array.length;
  let randomIndex: number;

  while (currentIndex > 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }

  return array;
}

export function isValidURL(url: string) {
  try {
    new URL(url);
    return true;
  } catch (_error) {
    return false;
  }
}

export function getShortcutStr(shortcut?: KeyboardShortcut, wrap = true) {
  if (!shortcut) return '';

  let str = SHORTCUT_KEY_DISPLAY_MAP[shortcut.mod1] ?? shortcut.mod1;
  if (shortcut.mod2)
    str += `+${SHORTCUT_KEY_DISPLAY_MAP[shortcut.mod2] ?? shortcut.mod2}`;

  str += `+${SHORTCUT_KEY_DISPLAY_MAP[shortcut.key] ?? shortcut.key.toUpperCase()}`;

  if (!wrap) return str;

  return `(${str})`;
}

export function generateRandomString(length = 12) {
  const characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  let result = '';

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    result += characters.charAt(randomIndex);
  }

  return result;
}
