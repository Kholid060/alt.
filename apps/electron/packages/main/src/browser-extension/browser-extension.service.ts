import { BrowserConnected, BrowserInfo } from '@alt-dot/shared';
import { Injectable } from '@nestjs/common';
import type { ExtensionNamespace } from './browser-extension.gateway';
import { isWSAckError } from '../utils/extension/ExtensionBrowserElementHandle';

@Injectable()
export class BrowserExtensionService {
  private server?: ExtensionNamespace;
  private connectedBrowsers: Map<string, BrowserInfo> = new Map();

  setSocket(server: ExtensionNamespace) {
    this.server = server;
  }

  getAll(focused?: boolean) {
    if (!this.server) return [];

    return this.server
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
    return [...this.connectedBrowsers.values()];
  }

  addConnectedBrowser(browser: BrowserInfo) {
    this.connectedBrowsers.set(browser.id, browser);
  }

  removeConnectedBrowser(browserId: string) {
    // eslint-disable-next-line drizzle/enforce-delete-with-where
    this.connectedBrowsers.delete(browserId);
  }
}
