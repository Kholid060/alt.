import WebsocketService from '@root/src/service/websocket.service';
import getBrowserInfo from '@root/src/utils/getBrowserInfo';
import Browser from 'webextension-polyfill';

class BackgroundBrowserEventListener {
  static instance = new BackgroundBrowserEventListener();

  constructor() {}

  startListeners() {
    Browser.runtime.onStartup.addListener(this.onStartup);
    Browser.action.onClicked.addListener(this.onActionClicked);
    Browser.windows.onFocusChanged.addListener(this.onWindowFocusChanged);
  }

  stopListeners() {
    Browser.runtime.onStartup.removeListener(this.onStartup);
    Browser.action.onClicked.removeListener(this.onActionClicked);
    Browser.windows.onFocusChanged.removeListener(this.onWindowFocusChanged);
  }

  private async onWindowFocusChanged(windowId: number) {
    if (windowId === Browser.windows.WINDOW_ID_NONE) return;

    const browserInfo = await getBrowserInfo();
    WebsocketService.instance.emitEvent('browser:last-accessed', {
      lastAccessed: Date.now(),
      browserId: browserInfo.id,
    });
  }

  private onStartup() {
    WebsocketService.instance.tryConnect();
  }

  private onActionClicked() {
    WebsocketService.instance.tryConnect();
  }
}

export default BackgroundBrowserEventListener;
