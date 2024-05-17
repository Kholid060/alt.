/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ExtensionMessagePortEvent } from '@repo/extension';
import type ExtensionAPI from '@repo/extension-core/types/extension-api';
import type { BetterMessagePortSync, EventMapEmit } from '@repo/shared';
import { nanoid } from 'nanoid/non-secure';
import { CUSTOM_SCHEME } from '../constant/constant';
import type { ExtensionAPIValues } from '@repo/extension-core/dist/extensionApiBuilder';
import { createExtensionElementHandle } from './extension-element-handle';
import type { IPCUserExtensionEventsMap } from '../../interface/ipc-events.interface';
import { APP_ICON_DIR_PREFIX } from '../../utils/constant/app.const';

export const extensionAPIGetIconURL = (): Pick<
  ExtensionAPIValues,
  'shell.installedApps.getIconURL'
> => ({
  'shell.installedApps.getIconURL': (appId) =>
    `${CUSTOM_SCHEME.fileIcon}://${APP_ICON_DIR_PREFIX}/${appId}`,
});

export function extensionAPISearchPanelEvent(
  messagePort?: BetterMessagePortSync<ExtensionMessagePortEvent>,
): Pick<
  ExtensionAPIValues,
  'ui.searchPanel.onChanged' | 'ui.searchPanel.onKeydown'
> {
  const createEventListener = (
    key: 'extension:query-change' | 'extension:keydown-event',
  ) => ({
    addListener: (callback: (...args: any[]) => void) => {
      messagePort?.on(key, callback);

      return () => {
        messagePort?.off(key, callback);
      };
    },
    removeListener: (callback: (...args: any[]) => void) => {
      messagePort?.off(key, callback);
    },
  });

  return {
    'ui.searchPanel.onChanged': createEventListener('extension:query-change'),
    'ui.searchPanel.onKeydown': createEventListener('extension:keydown-event'),
  };
}
export function extensionAPIUiToast(
  messagePort?: BetterMessagePortSync<ExtensionMessagePortEvent>,
): Pick<ExtensionAPIValues, 'ui.createToast'> {
  return {
    'ui.createToast': (options) => {
      const toastId = nanoid(5);
      const toastOptions: Required<ExtensionAPI.ui.ToastOptions> = {
        timeout: 0,
        type: 'success',
        description: '',
        ...options,
      };

      return {
        ...toastOptions,
        show(showOptions = {}) {
          messagePort?.sendMessage('extension:show-toast', toastId, {
            ...toastOptions,
            ...showOptions,
          });
        },
        hide() {
          messagePort?.sendMessage('extension:hide-toast', toastId);
        },
      };
    },
  };
}

export function extensionAPIBrowser(
  sendMessage: EventMapEmit<IPCUserExtensionEventsMap>,
): Pick<
  ExtensionAPIValues,
  | 'browser.activeTab.findAllElements'
  | 'browser.activeTab.findElement'
  | 'browser.activeTab.waitForSelector'
> {
  return {
    'browser.activeTab.findElement': (selector) => {
      return createExtensionElementHandle({
        selector,
        sendMessage,
      });
    },
    'browser.activeTab.findAllElements': (selector) => {
      return createExtensionElementHandle(
        {
          selector,
          sendMessage,
        },
        true,
      );
    },
    'browser.activeTab.waitForSelector': async (selector, options) => {
      await sendMessage('browser.activeTab.waitForSelector', selector, options);

      return createExtensionElementHandle({
        selector,
        sendMessage,
      });
    },
  };
}
