import { ExtensionError } from '#packages/common/errors/custom-errors';
import { onExtensionIPCEvent } from '../extension-api-event';
import BrowserService from '/@/services/browser.service';
import ExtensionWSNamespace from '/@/services/websocket/ws-namespaces/extensions.ws-namespace';

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
  if (result?.error) {
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
  if (result?.error) {
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
    if (result?.error) {
      throw new ExtensionError(result.errorMessage);
    }
  },
);
