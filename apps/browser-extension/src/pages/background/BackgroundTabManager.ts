import WebsocketService from '@root/src/service/websocket.service';
import browser from 'webextension-polyfill';
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
  activeTab: browser.Tabs.Tab | null = null;

  constructor() {
    this.activeTab = null;
    this.isWindowFocus = false;

    this.onTabsUpdated = this.onTabsUpdated.bind(this);
    this.onTabsActivated = this.onTabsActivated.bind(this);
    this.onWindowsFocusChanged = this.onWindowsFocusChanged.bind(this);
  }

  init() {
    browser.tabs.onUpdated.addListener(this.onTabsUpdated);
    browser.tabs.onActivated.addListener(this.onTabsActivated);

    browser.windows.onFocusChanged.addListener(this.onWindowsFocusChanged);
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
    WebsocketService.instance.sendEvent('active-browser-tab', payload);
  }

  private async onWindowsFocusChanged(windowId: number) {
    console.log('===', windowId);
    if (windowId === browser.windows.WINDOW_ID_NONE) {
      // double-check, the windowId is also -1 when changing active tab for some reason
      const currentWindow = await browser.windows.getCurrent();
      if (currentWindow.focused) return;

      WebsocketService.instance.sendEvent('active-browser-tab', null);
      this.isWindowFocus = false;
    } else {
      this.isWindowFocus = true;

      if (!this.activeTab || this.activeTab.windowId !== windowId) {
        const [activeTab] = await browser.tabs.query({
          active: true,
          currentWindow: true,
        });
        if (activeTab) this.activeTab = activeTab;
      }

      this.sendActiveTabToApp();
    }
  }

  private onTabsActivated(activeInfo: browser.Tabs.OnActivatedActiveInfoType) {
    browser.tabs.get(activeInfo.tabId).then((activeTab) => {
      this.updateActiveTab(activeTab);
    });
  }

  private onTabsUpdated(
    tabId: number,
    changeInfo: browser.Tabs.OnUpdatedChangeInfoType,
    tab: browser.Tabs.Tab,
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

  private updateActiveTab(tab: browser.Tabs.Tab | null) {
    this.activeTab = tab;

    this.sendActiveTabToApp();
  }
}

export default BackgroundTabManager;
