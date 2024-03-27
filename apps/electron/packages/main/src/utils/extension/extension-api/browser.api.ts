import { ExtensionError } from '#packages/common/errors/custom-errors';
import { onExtensionIPCEvent } from '../extension-api-event';
import BrowserService from '/@/services/server/browser.service';

onExtensionIPCEvent('browser.activeTab.get', () => {
  const activeTab = BrowserService.instance.activeBrowser?.tab;
  return Promise.resolve(
    activeTab ? { url: activeTab.url, title: activeTab.title } : null,
  );
});

onExtensionIPCEvent('browser.activeTab.reload', async () => {
  try {
    return await BrowserService.instance.reloadActiveTab();
  } catch (error) {
    throw new ExtensionError((error as Error).message);
  }
});
