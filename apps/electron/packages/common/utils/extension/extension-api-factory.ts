/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ExtensionMessagePortEvent } from '@altdot/extension';
import { ExtensionAPI } from '@altdot/extension';
import type { BetterMessagePortSync, EventMapEmit } from '@altdot/shared';
import { nanoid } from 'nanoid/non-secure';
import { CUSTOM_SCHEME } from '../constant/constant';
import type { ExtensionAPIValues } from '@altdot/extension/dist/extensionApiBuilder';
import { createExtensionElementHandle } from './extension-element-handle';
import type { IPCUserExtensionEventsMap } from '../../interface/ipc-events.interface';
import extensionApiBuilder from '@altdot/extension/dist/extensionApiBuilder';
import type { ExtensionBrowserTabContext } from '../../interface/extension.interface';
import { APP_ICON_DIR_PREFIX } from '../../utils/constant/app.const';
import { OAuthPKCEClient } from './extension-oauth-client';

export interface CreateExtensionAPI {
  context?: unknown;
  browserCtx: ExtensionBrowserTabContext;
  sendMessage: EventMapEmit<IPCUserExtensionEventsMap>;
  messagePort: BetterMessagePortSync<ExtensionMessagePortEvent>;
}

const extensionAPIGetIconURL = (): Pick<
  ExtensionAPIValues,
  'shell.installedApps.getIconURL'
> => ({
  'shell.installedApps.getIconURL': (appId) =>
    `${CUSTOM_SCHEME.fileIcon}://${APP_ICON_DIR_PREFIX}/${appId}`,
});

function extensionAPISearchPanel(
  messagePort: CreateExtensionAPI['messagePort'],
): Pick<
  ExtensionAPIValues,
  | 'ui.searchPanel.onChanged'
  | 'ui.searchPanel.onKeydown'
  | 'ui.searchPanel.clearValue'
  | 'ui.searchPanel.updatePlaceholder'
> {
  const createEventListener = (
    key: 'extension:query-change' | 'extension:keydown-event',
  ) => ({
    addListener: (callback: (...args: any[]) => void) => {
      messagePort.on(key, callback);

      return () => {
        messagePort.on(key, callback);
      };
    },
    removeListener: (callback: (...args: any[]) => void) => {
      messagePort.off(key, callback);
    },
  });

  return {
    'ui.searchPanel.onChanged': createEventListener('extension:query-change'),
    'ui.searchPanel.onKeydown': createEventListener('extension:keydown-event'),
    'ui.searchPanel.clearValue': () => {
      messagePort.sendMessage('extension:query-clear-value');
    },
    'ui.searchPanel.updatePlaceholder': (placeholder) => {
      messagePort.sendMessage(
        'extension:query-update-placeholder',
        placeholder,
      );
    },
  };
}
function extensionAPIUiToast(
  messagePort: CreateExtensionAPI['messagePort'],
): Pick<ExtensionAPIValues, 'ui.createToast'> {
  return {
    'ui.createToast': (options) => {
      const toastId = nanoid(5);
      const toastOptions: Required<ExtensionAPI.UI.ToastOptions> = {
        timeout: 0,
        type: 'success',
        description: '',
        ...options,
      };

      return {
        ...toastOptions,
        show(showOptions = {}) {
          messagePort.sendMessage('extension:show-toast', toastId, {
            ...toastOptions,
            ...showOptions,
          });
        },
        hide() {
          messagePort.sendMessage('extension:hide-toast', toastId);
        },
      };
    },
  };
}

function extensionAPIBrowser(
  sendMessage: CreateExtensionAPI['sendMessage'],
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

function extensionOAuth({
  sendMessage,
}: CreateExtensionAPI): Pick<ExtensionAPIValues, 'oAuth.createPKCE'> {
  return {
    'oAuth.createPKCE': (provider) => {
      return Object.freeze(new OAuthPKCEClient({ provider, sendMessage }));
    },
  };
}

export function createExtensionAPI({
  browserCtx,
  messagePort,
  sendMessage,
  context = null,
}: CreateExtensionAPI) {
  return Object.freeze(
    extensionApiBuilder({
      values: {
        ...extensionAPIGetIconURL(),
        ...extensionAPIUiToast(messagePort),
        ...extensionAPISearchPanel(messagePort),
        ...extensionAPIBrowser(sendMessage),
        ...extensionOAuth({ browserCtx, messagePort, sendMessage, context }),
        'browser.activeTab.get': () =>
          Promise.resolve(
            browserCtx
              ? {
                  url: browserCtx.url,
                  id: browserCtx.tabId,
                  title: browserCtx.title,
                }
              : null,
          ),
      },
      context,
      apiHandler: sendMessage,
    }),
  );
}
