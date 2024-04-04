import { ExtensionError } from '#packages/common/errors/custom-errors';
import { onExtensionIPCEvent } from '../extension-api-event';
import BrowserService from '/@/services/browser.service';
import ExtensionWSNamespace from '/@/services/websocket/ws-namespaces/extensions.ws-namespace';
import {
  extensionBrowserElementHandle,
  isWSAckError,
} from '../ExtensionBrowserElementHandle';
import type ExtensionAPI from '@repo/extension-core/types/extension-api';

const getElementSelector = (
  selector: ExtensionAPI.browser.ElementSelector,
): ExtensionAPI.browser.ElementSelectorDetail =>
  typeof selector === 'string' ? getElementSelector(selector) : selector;

onExtensionIPCEvent('browser.activeTab.get', () => {
  const activeTab = BrowserService.instance.activeBrowser?.tab;
  return Promise.resolve(
    activeTab ? { url: activeTab.url, title: activeTab.title } : null,
  );
});

onExtensionIPCEvent('browser.activeTab.reload', async () => {
  const { browserId, id, windowId } = BrowserService.instance.getActiveTab();

  const result = await ExtensionWSNamespace.instance.emitToBrowserWithAck(
    browserId,
    'tabs:reload',
    {
      windowId,
      tabId: id,
    },
  );
  if (isWSAckError(result)) {
    throw new ExtensionError(result.errorMessage);
  }
});

onExtensionIPCEvent('browser.activeTab.click', (_, selector) => {
  return extensionBrowserElementHandle('click', getElementSelector(selector));
});

onExtensionIPCEvent('browser.activeTab.type', (_, selector, text, options) => {
  return extensionBrowserElementHandle(
    'type',
    getElementSelector(selector),
    text,
    options ?? {},
  );
});

onExtensionIPCEvent('browser.activeTab.getText', (_, selector, options) => {
  return extensionBrowserElementHandle(
    'getText',
    getElementSelector(selector ?? 'html'),
    options,
  );
});

onExtensionIPCEvent('browser.activeTab.select', (_, selector, ...values) => {
  return extensionBrowserElementHandle(
    'select',
    getElementSelector(selector),
    values,
  );
});

onExtensionIPCEvent('browser.activeTab.keyDown', (_, selector, ...args) => {
  return extensionBrowserElementHandle(
    'keyDown',
    getElementSelector(selector),
    ...args,
  );
});

onExtensionIPCEvent('browser.activeTab.keyUp', (_, selector, ...args) => {
  return extensionBrowserElementHandle(
    'keyUp',
    getElementSelector(selector),
    ...args,
  );
});

onExtensionIPCEvent('browser.activeTab.press', (_, selector, ...args) => {
  return extensionBrowserElementHandle(
    'press',
    getElementSelector(selector),
    ...args,
  );
});

onExtensionIPCEvent(
  'browser.activeTab.getAttributes',
  (_, selector, attrNames) => {
    return extensionBrowserElementHandle(
      'getAttributes',
      getElementSelector(selector),
      attrNames ?? null,
    );
  },
);

onExtensionIPCEvent(
  'browser.activeTab.elementExists',
  async (_, selector, multiple) => {
    const { browserId, id, windowId } = BrowserService.instance.getActiveTab();

    const result = await ExtensionWSNamespace.instance.emitToBrowserWithAck(
      browserId,
      'tabs:element-exists',
      {
        windowId,
        tabId: id,
      },
      { selector },
      multiple ?? false,
    );
    if (isWSAckError(result)) {
      throw new ExtensionError(result.errorMessage);
    }

    return result;
  },
);
