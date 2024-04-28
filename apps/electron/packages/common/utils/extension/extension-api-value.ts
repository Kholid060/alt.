/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ExtensionMessagePortEvent } from '@repo/extension';
import type ExtensionAPI from '@repo/extension-core/types/extension-api';
import type { AMessagePort } from '@repo/shared';
import { nanoid } from 'nanoid/non-secure';
import { APP_ICON_DIR_PREFIX, CUSTOM_SCHEME } from '../constant/constant';
import type { ExtensionAPIValues } from '@repo/extension-core/dist/extensionApiBuilder';

export const extensionAPIGetIconURL = (): Pick<
  ExtensionAPIValues,
  'shell.installedApps.getIconURL'
> => ({
  'shell.installedApps.getIconURL': (appId) =>
    `${CUSTOM_SCHEME.fileIcon}://${APP_ICON_DIR_PREFIX}/${appId}`,
});

export function extensionAPISearchPanelEvent(
  messagePort?: AMessagePort<ExtensionMessagePortEvent>,
): Pick<
  ExtensionAPIValues,
  'ui.searchPanel.onChanged' | 'ui.searchPanel.onKeydown'
> {
  const createEventListener = (
    key: 'extension:query-change' | 'extension:keydown-event',
  ) => ({
    addListener: (callback: (...args: any[]) => void) => {
      messagePort?.addListener(key, callback);
    },
    removeListener: (callback: (...args: any[]) => void) => {
      messagePort?.removeListener(key, callback);
    },
  });

  return {
    'ui.searchPanel.onChanged': createEventListener('extension:query-change'),
    'ui.searchPanel.onKeydown': createEventListener('extension:keydown-event'),
  };
}

export function extensionAPIUiToast(
  messagePort?: AMessagePort<ExtensionMessagePortEvent>,
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
