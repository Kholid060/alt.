import { IS_FIREFOX } from './constant/constant';

export function getShadowRoot(element: Element) {
  if (IS_FIREFOX) {
    return element.openOrClosedShadowRoot();
  }

  return chrome.dom?.openOrClosedShadowRoot(element as HTMLElement);
}

export function debugLog(...args: unknown[]) {
  if (import.meta.env.DEV) console.log(...args);
}
