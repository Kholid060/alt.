import type { BrowserExtensionTab, BrowserInfo } from '@repo/shared';
import { ExtensionError } from '#packages/common/errors/custom-errors';

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

  getActiveTab() {
    if (!this.activeBrowser) throw new ExtensionError('No active browser');
    if (!this.activeBrowser.tab)
      throw new ExtensionError('No active browser tab');

    return { ...this.activeBrowser.tab, browserId: this.activeBrowser.id };
  }
}

export default BrowserService;
