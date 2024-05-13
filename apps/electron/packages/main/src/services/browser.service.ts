import type { BrowserExtensionTab, BrowserInfo } from '@repo/shared';
import type { ExtensionBrowserTabContext } from '#packages/common/interface/extension.interface';

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

  activeBrowser: ActiveBrowser | null;
  browsers: Map<string, BrowserInfo>;

  constructor() {
    this.browsers = new Map();
    this.activeBrowser = null;
  }

  getActiveTab(): ExtensionBrowserTabContext {
    if (!this.activeBrowser) return null;
    if (!this.activeBrowser.tab) return null;

    return { ...this.activeBrowser.tab, browserId: this.activeBrowser.id };
  }
}

export default BrowserService;
