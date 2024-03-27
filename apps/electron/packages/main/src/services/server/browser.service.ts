import type { BrowserExtensionTab, BrowserInfo } from '@repo/shared';
import ServerService from './server.service';

interface ActiveBrowser {
  id: string;
  tab: BrowserExtensionTab | null;
}

class BrowserService {
  private static _instance: BrowserService | null = null;
  static get instance() {
    if (!this._instance) {
      this._instance = new BrowserService();
    }

    return this._instance;
  }

  browsers: Map<string, BrowserInfo>;
  activeBrowser: ActiveBrowser | null;

  constructor() {
    this.browsers = new Map();
    this.activeBrowser = null;
  }

  private _getActiveTab() {
    if (!this.activeBrowser) throw new Error('No active browser');
    if (!this.activeBrowser.tab) throw new Error('No active browser tab');

    return { ...this.activeBrowser.tab, browserId: this.activeBrowser.id };
  }

  async reloadActiveTab() {
    const { browserId, id, windowId } = this._getActiveTab();

    await ServerService.instance.messagePort.sendMessage('tabs:reload', {
      windowId,
      browserId,
      tabId: id,
    });
  }
}

export default BrowserService;
