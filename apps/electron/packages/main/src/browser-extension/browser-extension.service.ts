import {
  AllButLast,
  BrowserConnected,
  BrowserInfo,
  ExtensionWSServerToClientEvents,
  Last,
} from '@altdot/shared';
import { Injectable } from '@nestjs/common';
import { CustomError } from '#packages/common/errors/custom-errors';
import { isWSAckError } from '../common/utils/helper';
import { BrowserExtensionNamespace } from './browser-extension.interface';

type ExtensionBrowserInfo = BrowserInfo & { socketId: string };

const BROWSER_EMIT_TIMEOUT_MS = 60_000;

@Injectable()
export class BrowserExtensionService {
  private server?: BrowserExtensionNamespace;
  private connectedBrowsers: Map<string, ExtensionBrowserInfo> = new Map();

  private getBrowserSocket(browserId: string) {
    if (!this.server) return null;

    const browser = this.connectedBrowsers.get(browserId);
    if (!browser) return null;

    const socket = this.server.sockets.get(browser.socketId);
    return socket ?? null;
  }

  isBrowserConnected() {
    return this.connectedBrowsers.size > 0;
  }

  async getActiveTab(browserId?: string) {
    if (browserId) {
      const tab = await this.emitToBrowserWithAck({
        args: [],
        browserId,
        name: 'tabs:get-active',
      });
      if (isWSAckError(tab)) throw new Error(tab.errorMessage);

      return {
        browserId,
        url: tab.url,
        tabId: tab.id,
        $isError: false,
        title: tab.title,
      };
    }

    const browser = await this.getFocused();
    if (!browser) throw new CustomError("Couldn't find active browser");

    return {
      $isError: false,
      url: browser.tab.url,
      browserId: browser.id,
      tabId: browser.tab.id,
      title: browser.tab.title,
    };
  }

  setSocket(server: BrowserExtensionNamespace) {
    this.server = server;
  }

  async getFocused(): Promise<BrowserConnected | null> {
    const tabs = await Promise.allSettled(
      this.getConnectedBrowsers().map(async (browser) => {
        const { socketId, ...browserInfo } = browser;
        const socket = this.server?.sockets.get(socketId);
        const tab = await socket?.timeout(5000).emitWithAck('tabs:query', {
          active: true,
          lastFocusedBrowser: true,
        });
        if (!tab || isWSAckError(tab)) return null;
        if (!tab[0]) return null;

        return {
          ...browserInfo,
          focused: true,
          tab: tab[0],
        };
      }),
    );

    return tabs.find((item) => item.status === 'fulfilled')?.value ?? null;
  }

  getConnectedBrowsers() {
    return [...this.connectedBrowsers.values()];
  }

  addConnectedBrowser(browser: ExtensionBrowserInfo) {
    this.connectedBrowsers.set(browser.id, browser);
  }

  removeConnectedBrowser(browserId: string) {
    // eslint-disable-next-line drizzle/enforce-delete-with-where
    this.connectedBrowsers.delete(browserId);
  }

  emitToBrowser<T extends keyof ExtensionWSServerToClientEvents>(
    browserId: string,
    name: T,
    ...args: Parameters<ExtensionWSServerToClientEvents[T]>
  ) {
    const socket = this.getBrowserSocket(browserId);
    if (!socket) throw new Error("Couldn't find browser socket");

    return socket.emit(name, ...args);
  }

  emitToBrowserWithAck<T extends keyof ExtensionWSServerToClientEvents>({
    args,
    name,
    timeout,
    browserId,
  }: {
    name: T;
    timeout?: number;
    browserId: string;
    args: AllButLast<Parameters<ExtensionWSServerToClientEvents[T]>>;
  }): Promise<
    Parameters<Last<Parameters<ExtensionWSServerToClientEvents[T]>>>[0]
  > {
    const socket = this.getBrowserSocket(browserId);
    if (!socket) throw new Error("Couldn't find browser socket");

    return socket
      .timeout(timeout ?? BROWSER_EMIT_TIMEOUT_MS)
      .emitWithAck(name as never, ...(args as never));
  }
}
