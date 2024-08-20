/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
  ExtensionMessagePortEvent,
  ExtensionMessagePortEventAsync,
} from '@altdot/extension';
import { ExtensionAPI } from '@altdot/extension';
import type { BetterMessagePort } from '@altdot/shared';
import { nanoid } from 'nanoid/non-secure';
import { CUSTOM_SCHEME } from '../constant/constant';
import type { ExtensionAPIValues } from '@altdot/extension/dist/extensionApiBuilder';
import type { IPCUserExtensionEventsMap } from '../../interface/ipc-events.interface';
import extensionApiBuilder from '@altdot/extension/dist/extensionApiBuilder';
import type { ExtensionBrowserTabContext } from '../../interface/extension.interface';
import { APP_ICON_DIR_PREFIX } from '../../utils/constant/app.const';
import { OAuthPKCEClient } from './extension-oauth-client';
import { ExtensionBrowserTab } from './extension-browser-api';
import { createSqliteStatement } from './extension-sqlite-utils';

export interface CreateExtensionAPI {
  context?: unknown;
  browserCtx: ExtensionBrowserTabContext;
  platform: ExtensionAPI.Runtime.PlatformInfo;
  sendMessage: <T extends keyof IPCUserExtensionEventsMap>(
    name: T,
    ...args: Parameters<IPCUserExtensionEventsMap[T]>
  ) => ReturnType<IPCUserExtensionEventsMap[T]>;
  messagePort: BetterMessagePort<
    ExtensionMessagePortEventAsync,
    ExtensionMessagePortEvent
  >;
}

const sendTabActionMessage: (
  sendMessage: CreateExtensionAPI['sendMessage'],
) => IPCUserExtensionEventsMap['browser.tabs.#actions'] =
  // @ts-expect-error wrapper
  (sendMessage) => (detail) => {
    return sendMessage('browser.tabs.#actions', detail);
  };

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
      messagePort.sync.on(key, callback);

      return () => {
        messagePort.sync.on(key, callback);
      };
    },
    removeListener: (callback: (...args: any[]) => void) => {
      messagePort.sync.off(key, callback);
    },
  });

  return {
    'ui.searchPanel.onChanged': createEventListener('extension:query-change'),
    'ui.searchPanel.onKeydown': createEventListener('extension:keydown-event'),
    'ui.searchPanel.clearValue': () => {
      messagePort.sync.sendMessage('extension:query-clear-value');
    },
    'ui.searchPanel.updatePlaceholder': (placeholder) => {
      messagePort.sync.sendMessage(
        'extension:query-update-placeholder',
        placeholder,
      );
    },
  };
}
function extensionAPIUi(
  messagePort: CreateExtensionAPI['messagePort'],
): Pick<
  ExtensionAPIValues,
  'ui.createToast' | 'ui.alert.confirm' | 'ui.showToast'
> {
  return {
    'ui.alert.confirm': (options) => {
      return messagePort.async.sendMessage(
        'extension:show-confirm-alert',
        options,
      );
    },
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
          messagePort.sync.sendMessage('extension:show-toast', toastId, {
            ...toastOptions,
            ...showOptions,
          });
        },
        hide() {
          messagePort.sync.sendMessage('extension:hide-toast', toastId);
        },
      };
    },
    'ui.showToast': (options) => {
      const toastId = nanoid(5);
      const toastOptions: Required<ExtensionAPI.UI.ToastOptions> = {
        timeout: 5000,
        type: 'success',
        description: '',
        ...options,
      };
      messagePort.sync.sendMessage(
        'extension:show-toast',
        toastId,
        toastOptions,
      );
    },
  };
}

function extensionOAuth({
  sendMessage,
}: Pick<CreateExtensionAPI, 'sendMessage'>): Pick<
  ExtensionAPIValues,
  'oAuth.createPKCE'
> {
  return {
    'oAuth.createPKCE': (provider) => {
      return Object.freeze(new OAuthPKCEClient({ provider, sendMessage }));
    },
  };
}

function extensionBrowserTabs({
  browserCtx,
  sendMessage,
}: Pick<CreateExtensionAPI, 'browserCtx' | 'sendMessage'>): Pick<
  ExtensionAPIValues,
  'browser.tabs.query' | 'browser.tabs.getActive'
> {
  return {
    'browser.tabs.getActive': async () => {
      if (!browserCtx) return null;

      return new ExtensionBrowserTab(
        {
          browserId: browserCtx.browserId,
          title: browserCtx.title,
          active: true,
          id: browserCtx.tabId,
          url: browserCtx.url,
        },
        sendMessage,
      );
    },
    'browser.tabs.query': async (options) => {
      if (!browserCtx) throw new Error('No active browser');

      const tabs = await sendTabActionMessage(sendMessage)({
        args: [options],
        name: 'tabs:query',
        browserId: browserCtx.browserId,
      });
      return tabs.map(
        (tab) =>
          new ExtensionBrowserTab(
            { ...tab, browserId: browserCtx.browserId },
            sendMessage,
          ),
      );
    },
  };
}

function extensionSqlite({
  sendMessage,
}: Pick<CreateExtensionAPI, 'sendMessage'>): Pick<
  ExtensionAPIValues,
  'sqlite.sql'
> {
  return {
    'sqlite.sql': (sql) => createSqliteStatement(sql, { sendMessage }),
  };
}

export function createExtensionAPI({
  platform,
  browserCtx,
  messagePort,
  sendMessage,
  context = null,
}: CreateExtensionAPI) {
  return Object.freeze(
    extensionApiBuilder({
      values: {
        ...extensionAPIGetIconURL(),
        ...extensionAPIUi(messagePort),
        ...extensionOAuth({ sendMessage }),
        ...extensionAPISearchPanel(messagePort),
        ...extensionBrowserTabs({
          browserCtx,
          sendMessage,
        }),
        ...extensionSqlite({ sendMessage }),
        'runtime.platform': platform,
        'runtime.getFileIconURL': (filePath) =>
          `${CUSTOM_SCHEME.fileIcon}://${filePath}`,
      },
      context,
      apiHandler: sendMessage,
    }),
  );
}
