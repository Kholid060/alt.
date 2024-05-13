import { ExtensionError } from '#packages/common/errors/custom-errors';
import ExtensionIPCEvent from '../ExtensionIPCEvent';
import BrowserService from '/@/services/browser.service';
import ExtensionWSNamespace from '/@/services/websocket/ws-namespaces/extensions.ws-namespace';
import {
  extensionBrowserElementHandle,
  isWSAckError,
} from '../ExtensionBrowserElementHandle';
import type ExtensionAPI from '@repo/extension-core/types/extension-api';
import { tempHideCommandWindow } from '../../helper';

const getElementSelector = (
  selector: ExtensionAPI.browser.ElementSelector,
): ExtensionAPI.browser.ElementSelectorDetail =>
  typeof selector === 'string' ? getElementSelector(selector) : selector;

ExtensionIPCEvent.instance.on('browser.activeTab.get', () => {
  const activeTab = BrowserService.instance.activeBrowser?.tab;
  return Promise.resolve(
    activeTab ? { url: activeTab.url, title: activeTab.title } : null,
  );
});

ExtensionIPCEvent.instance.on('browser.activeTab.reload', async () => {
  const { browserId, id, windowId } = BrowserService.instance.getActiveTab();

  const result = await ExtensionWSNamespace.instance.emitToBrowserWithAck({
    browserId,
    name: 'tabs:reload',
    args: [
      {
        windowId,
        tabId: id,
      },
    ],
  });
  if (isWSAckError(result)) {
    throw new ExtensionError(result.errorMessage);
  }
});

ExtensionIPCEvent.instance.on('browser.activeTab.click', (_, selector) => {
  return extensionBrowserElementHandle('click', getElementSelector(selector));
});

ExtensionIPCEvent.instance.on(
  'browser.activeTab.type',
  (_, selector, text, options) => {
    return extensionBrowserElementHandle(
      'type',
      getElementSelector(selector),
      text,
      options ?? {},
    );
  },
);

ExtensionIPCEvent.instance.on(
  'browser.activeTab.getText',
  (_, selector, options) => {
    return extensionBrowserElementHandle(
      'getText',
      getElementSelector(selector ?? 'html'),
      options,
    );
  },
);

ExtensionIPCEvent.instance.on(
  'browser.activeTab.select',
  (_, selector, ...values) => {
    return extensionBrowserElementHandle(
      'select',
      getElementSelector(selector),
      values,
    );
  },
);

ExtensionIPCEvent.instance.on(
  'browser.activeTab.keyDown',
  (_, selector, ...args) => {
    return extensionBrowserElementHandle(
      'keyDown',
      getElementSelector(selector),
      ...args,
    );
  },
);

ExtensionIPCEvent.instance.on(
  'browser.activeTab.keyUp',
  (_, selector, ...args) => {
    return extensionBrowserElementHandle(
      'keyUp',
      getElementSelector(selector),
      ...args,
    );
  },
);

ExtensionIPCEvent.instance.on(
  'browser.activeTab.press',
  (_, selector, ...args) => {
    return extensionBrowserElementHandle(
      'press',
      getElementSelector(selector),
      ...args,
    );
  },
);

ExtensionIPCEvent.instance.on(
  'browser.activeTab.getAttributes',
  (_, selector, attrNames) => {
    return extensionBrowserElementHandle(
      'getAttributes',
      getElementSelector(selector),
      attrNames ?? null,
    );
  },
);

ExtensionIPCEvent.instance.on(
  'browser.activeTab.elementExists',
  async (_, selector, multiple) => {
    const { browserId, id, windowId } = BrowserService.instance.getActiveTab();

    const result = await ExtensionWSNamespace.instance.emitToBrowserWithAck({
      browserId,
      name: 'tabs:element-exists',
      args: [
        {
          windowId,
          tabId: id,
        },
        { selector },
        multiple ?? false,
      ],
    });
    if (isWSAckError(result)) {
      throw new ExtensionError(result.errorMessage);
    }

    return result;
  },
);

ExtensionIPCEvent.instance.on(
  'browser.activeTab.selectElement',
  async (_, options) => {
    const { browserId, id, windowId } = BrowserService.instance.getActiveTab();
    const selectedElement = await tempHideCommandWindow(async () => {
      const result = await ExtensionWSNamespace.instance.emitToBrowserWithAck({
        browserId,
        timeout: 300_000, // 5 minutes
        name: 'tabs:select-element',
        args: [
          {
            windowId,
            tabId: id,
          },
          options ?? {},
        ],
      });
      if (isWSAckError(result)) {
        throw new ExtensionError(result.errorMessage);
      }

      return result;
    });

    return selectedElement;
  },
);

ExtensionIPCEvent.instance.on(
  'browser.activeTab.waitForSelector',
  // @ts-expect-error for waiting the element
  async (_, selector, options) => {
    const timeout = Math.max(+(options?.timeout || 90_000), 10_000);
    const { browserId, id, windowId } = BrowserService.instance.getActiveTab();
    const result = await ExtensionWSNamespace.instance.emitToBrowserWithAck({
      timeout,
      browserId,
      name: 'tabs:wait-for-selector',
      args: [
        {
          windowId,
          tabId: id,
        },
        { selector },
        { timeout, ...(options ?? {}) },
      ],
    });
    if (isWSAckError(result)) {
      throw new ExtensionError(result.errorMessage);
    }
  },
);
