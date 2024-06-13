import type { BrowserConnected, BrowserInfo } from '@alt-dot/shared';
import { isWSAckError } from '../utils/extension/ExtensionBrowserElementHandle';
import ExtensionWSNamespace from './websocket/ws-namespaces/extensions.ws-namespace';

class BrowserService {
  private static _instance: BrowserService | null = null;
  static get instance() {
    return this._instance || (this._instance = new BrowserService());
  }

  socket: ExtensionWSNamespace;
  private connectedBrowser: Map<string, BrowserInfo> = new Map();

  constructor() {
    this.socket = ExtensionWSNamespace.instance;
  }

  getAll(focused?: boolean) {
    return ExtensionWSNamespace.instance.namespace
      .timeout(5000)
      .emitWithAck('browser:get-active', focused ? 'focused-only' : 'none');
  }

  async getFocused(): Promise<BrowserConnected | null> {
    const browsers = await this.getAll(true);
    return browsers.find(
      (browser) => !isWSAckError(browser) && browser && browser.focused,
    ) as BrowserConnected;
  }

  getConnectedBrowsers() {
    return [...this.connectedBrowser.values()];
  }

  addConnectedBrowser(browser: BrowserInfo) {
    this.connectedBrowser.set(browser.id, browser);
  }

  removeConnectedBrowser(browserId: string) {
    this.connectedBrowser.delete(browserId);
  }
}

export default BrowserService;
