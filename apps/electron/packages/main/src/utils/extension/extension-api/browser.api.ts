import { ExtensionError } from '#packages/common/errors/custom-errors';
import type { WSAckErrorResult } from '@repo/shared';
import { isObject } from '@repo/shared';
import { onExtensionIPCEvent } from '../extension-api-event';
import BrowserService from '/@/services/browser.service';
import ExtensionWSNamespace from '/@/services/websocket/ws-namespaces/extensions.ws-namespace';

function isWSAckError(result: unknown): result is WSAckErrorResult {
  return Boolean(result) && isObject(result) && 'error' in result;
}

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

onExtensionIPCEvent('browser.activeTab.click', async (_, selector) => {
  const { browserId, id, windowId } = BrowserService.instance.getActiveTab();

  const result = await ExtensionWSNamespace.instance.emitToBrowserWithAck(
    browserId,
    'tabs:click',
    {
      windowId,
      tabId: id,
    },
    selector,
  );
  if (isWSAckError(result)) {
    throw new ExtensionError(result.errorMessage);
  }
});

onExtensionIPCEvent(
  'browser.activeTab.type',
  async (_, selector, text, options) => {
    const { browserId, id, windowId } = BrowserService.instance.getActiveTab();

    const result = await ExtensionWSNamespace.instance.emitToBrowserWithAck(
      browserId,
      'tabs:type',
      {
        windowId,
        tabId: id,
      },
      {
        text,
        options,
        selector,
      },
    );
    if (isWSAckError(result)) {
      throw new ExtensionError(result.errorMessage);
    }
  },
);

onExtensionIPCEvent(
  'browser.activeTab.getText',
  async (_, selector, options) => {
    const { browserId, id, windowId } = BrowserService.instance.getActiveTab();

    const result = await ExtensionWSNamespace.instance.emitToBrowserWithAck(
      browserId,
      'tabs:get-text',
      {
        windowId,
        tabId: id,
      },
      { selector: selector ?? 'html', options },
    );
    if (isWSAckError(result)) {
      throw new ExtensionError(result.errorMessage);
    }

    return result;
  },
);

onExtensionIPCEvent(
  'browser.activeTab.select',
  async (_, selector, ...values) => {
    const { browserId, id, windowId } = BrowserService.instance.getActiveTab();

    const result = await ExtensionWSNamespace.instance.emitToBrowserWithAck(
      browserId,
      'tabs:select',
      {
        windowId,
        tabId: id,
      },
      selector,
      values,
    );
    if (isWSAckError(result)) {
      throw new ExtensionError(result.errorMessage);
    }

    return result;
  },
);
