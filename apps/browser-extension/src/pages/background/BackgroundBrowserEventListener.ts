import WebsocketService from '@root/src/service/websocket.service';
import Browser from 'webextension-polyfill';

class BackgroundBrowserEventListener {
  static instance = new BackgroundBrowserEventListener();

  constructor() {}

  startListeners() {
    Browser.action.onClicked.addListener(this.onActionClicked);
  }

  stopListeners() {
    Browser.action.onClicked.removeListener(this.onActionClicked);
  }

  private onActionClicked() {
    WebsocketService.instance.tryConnect();
  }
}

export default BackgroundBrowserEventListener;