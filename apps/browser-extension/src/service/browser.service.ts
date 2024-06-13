import { BrowserConnected, debounce } from '@alt-dot/shared';
import Browser from 'webextension-polyfill';
import getBrowserInfo from '../utils/getBrowserInfo';

class BrowserService {
  private static _instance: BrowserService | null = null;
  static get instance() {
    return this._instance || (this._instance = new BrowserService());
  }

  private isFocused = false;
  private activeTab: Browser.Tabs.Tab | null = null;

  constructor() {
    this.onTabsUpdated = this.onTabsUpdated.bind(this);
    this.onTabsActivated = debounce(this.onTabsActivated.bind(this), 250);
    this.onWindowsFocusChanged = debounce(
      this.onWindowsFocusChanged.bind(this),
      250,
    );
  }

  async startListener() {
    try {
      Browser.tabs.onUpdated.addListener(this.onTabsUpdated);
      Browser.tabs.onActivated.addListener(this.onTabsActivated);

      Browser.windows.onFocusChanged.addListener(this.onWindowsFocusChanged);

      const currentWindow = await Browser.windows.getCurrent();
      this.isFocused = currentWindow.focused;

      if (currentWindow.focused) {
        const [activeTab] = await Browser.tabs.query({
          active: true,
          windowId: currentWindow.id,
        });
        this.activeTab = activeTab;
      }
    } catch (error) {
      console.error(error);
    }
  }

  stopListener() {
    Browser.tabs.onUpdated.removeListener(this.onTabsUpdated);
    Browser.tabs.onActivated.removeListener(this.onTabsActivated);

    Browser.windows.onFocusChanged.removeListener(this.onWindowsFocusChanged);

    this.activeTab = null;
    this.isFocused = false;
  }

  async getDetail(): Promise<BrowserConnected | null> {
    if (!this.activeTab) return null;

    const browserInfo = await getBrowserInfo();
    return {
      ...browserInfo,
      focused: this.isFocused,
      tab: {
        id: this.activeTab.id!,
        url: this.activeTab.url!,
        title: this.activeTab.title!,
        windowId: this.activeTab.windowId!,
      },
    };
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
      this.activeTab = tab;
    } else if (
      changeInfo.title &&
      this.activeTab &&
      this.activeTab.id === tabId
    ) {
      this.activeTab.title = changeInfo.title;
    }
  }

  private onWindowsFocusChanged() {
    Browser.windows.getLastFocused().then((window) => {
      this.isFocused = window.focused;
    });
  }

  private onTabsActivated(activeInfo: Browser.Tabs.OnActivatedActiveInfoType) {
    Browser.tabs.get(activeInfo.tabId).then((activeTab) => {
      this.activeTab = activeTab;
    });
  }
}

export default BrowserService;
