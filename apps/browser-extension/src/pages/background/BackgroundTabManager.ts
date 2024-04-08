import WebsocketService from '@root/src/service/websocket.service';
import Browser from 'webextension-polyfill';
import { BrowserExtensionTab } from '@repo/shared';

class BackgroundTabManager {
  private static _instance: BackgroundTabManager | null = null;
  static get instance() {
    if (!this._instance) {
      this._instance = new BackgroundTabManager();
    }
    return this._instance;
  }

  isWindowFocus: boolean;
  activeTab: Browser.Tabs.Tab | null = null;

  constructor() {
    this.activeTab = null;
    this.isWindowFocus = false;

    this.onTabsUpdated = this.onTabsUpdated.bind(this);
    this.onTabsActivated = this.onTabsActivated.bind(this);
    this.onWindowsFocusChanged = this.onWindowsFocusChanged.bind(this);
  }

  async init() {
    Browser.tabs.onUpdated.addListener(this.onTabsUpdated);
    Browser.tabs.onActivated.addListener(this.onTabsActivated);

    Browser.windows.onFocusChanged.addListener(this.onWindowsFocusChanged);

    const currentWindow = await Browser.windows.getCurrent();
    this.isWindowFocus = currentWindow.focused;

    if (currentWindow.focused) {
      const [activeTab] = await Browser.tabs.query({
        active: true,
        windowId: currentWindow.id,
      });
      this.updateActiveTab(activeTab);
    }
  }

  private sendActiveTabToApp() {
    if (
      this.activeTab &&
      (!this.activeTab.url ||
        !this.activeTab.id ||
        !this.activeTab.windowId ||
        !this.isWindowFocus)
    )
      return;

    const payload: BrowserExtensionTab | null = this.activeTab
      ? {
          id: this.activeTab.id!,
          url: this.activeTab.url!,
          title: this.activeTab.title!,
          windowId: this.activeTab.windowId!,
        }
      : null;
    WebsocketService.instance.emitEvent('tabs:active', payload);
  }

  private async onWindowsFocusChanged(windowId: number) {
    if (windowId === Browser.windows.WINDOW_ID_NONE) {
      // double-check, the windowId is also -1 when changing active tab for some reason
      const currentWindow = await Browser.windows.getCurrent();
      if (currentWindow.focused) return;

      WebsocketService.instance.emitEvent('tabs:active', null);
      this.isWindowFocus = false;
    } else {
      this.isWindowFocus = true;

      if (!this.activeTab || this.activeTab?.windowId !== windowId) {
        const [activeTab] = await Browser.tabs.query({
          active: true,
          currentWindow: true,
        });
        if (activeTab) this.activeTab = activeTab;
      }

      this.sendActiveTabToApp();
    }
  }

  private onTabsActivated(activeInfo: Browser.Tabs.OnActivatedActiveInfoType) {
    Browser.tabs.get(activeInfo.tabId).then((activeTab) => {
      this.updateActiveTab(activeTab);
    });
  }

  private onTabsUpdated(
    tabId: number,
    changeInfo: Browser.Tabs.OnUpdatedChangeInfoType,
    tab: Browser.Tabs.Tab,
  ) {
    if (
      !this.activeTab ||
      (changeInfo.status &&
        changeInfo.status === 'complete' &&
        tabId === this.activeTab?.id)
    ) {
      this.updateActiveTab(tab);
    } else if (changeInfo.title && this.activeTab) {
      this.activeTab.title = changeInfo.title;
    }
  }

  private updateActiveTab(tab: Browser.Tabs.Tab | null) {
    this.activeTab = tab;

    this.sendActiveTabToApp();
  }

  destroy() {
    Browser.tabs.onUpdated.removeListener(this.onTabsUpdated);
    Browser.tabs.onActivated.removeListener(this.onTabsActivated);

    Browser.windows.onFocusChanged.removeListener(this.onWindowsFocusChanged);

    this.activeTab = null;
    this.isWindowFocus = false;
  }
}

export default BackgroundTabManager;
