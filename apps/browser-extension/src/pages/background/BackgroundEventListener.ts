import browser from 'webextension-polyfill';

class BackgroundEventListener {
  private static _instance: BackgroundEventListener | null = null;

  static get instance() {
    if (!this._instance) {
      this._instance = new BackgroundEventListener();
    }

    return this._instance;
  }

  constructor() {}

  init() {
    browser.tabs.onUpdated.addListener((tabId, changeinfo) => {
      console.log('update', tabId, changeinfo);
    });
    browser.tabs.onActivated.addListener((activeInfo) => {
      console.log('active', activeInfo, browser.tabs.get(activeInfo.tabId));
    });
  }
}

export default BackgroundEventListener;
