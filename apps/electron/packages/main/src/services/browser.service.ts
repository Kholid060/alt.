import type { BrowserExtensionTab, BrowserInfo } from '@repo/shared';
import type { ExtensionBrowserTabContext } from '#packages/common/interface/extension.interface';
import ExtensionWSNamespace from './websocket/ws-namespaces/extensions.ws-namespace';

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

  private activeBrowser: ActiveBrowser | null;
  private connectedBrowsers: Map<string, BrowserInfo & { active: boolean }>;

  socket: ExtensionWSNamespace;

  constructor() {
    this.activeBrowser = null;
    this.connectedBrowsers = new Map();
    this.socket = ExtensionWSNamespace.instance;
  }

  getActiveTab(): ExtensionBrowserTabContext {
    if (!this.activeBrowser) return null;
    if (!this.activeBrowser.tab) return null;

    return { ...this.activeBrowser.tab, browserId: this.activeBrowser.id };
  }

  setActiveTab(browser: ActiveBrowser | null) {
    this.activeBrowser = browser;

    if (!browser || !this.connectedBrowsers.has(browser.id)) return;

    const browserInfo = this.connectedBrowsers.get(browser.id)!;
    browserInfo.active = true;

    this.connectedBrowsers.set(browser.id, browserInfo);
  }

  getBrowser(browserId: string) {
    return this.connectedBrowsers.get(browserId);
  }

  addConnectedBrowser(browser: BrowserInfo) {
    this.connectedBrowsers.set(browser.id, { ...browser, active: false });
  }

  getConnectedBrowser() {
    return [...this.connectedBrowsers.values()];
  }

  removeConnectedBrowser(browserId: string) {
    this.connectedBrowsers.delete(browserId);
  }
}

export default BrowserService;
