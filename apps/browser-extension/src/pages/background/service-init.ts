import BrowserService from '@root/src/service/browser.service';
import WebsocketService from '@root/src/service/websocket.service';
import Browser from 'webextension-polyfill';
import BackgroundBrowserEventListener from './BackgroundBrowserEventListener';

function initWebsocketService() {
  WebsocketService.instance.addListener('connect', async () => {
    BrowserService.instance.startListener();
    await Browser.action.setBadgeText({ text: ' ' });
    await Browser.action.setBadgeBackgroundColor({ color: '#6E56CF' });
  });
  WebsocketService.instance.addListener('disconnect', async () => {
    BrowserService.instance.stopListener();
    await Browser.action.setBadgeText({ text: '' });
    await Browser.action.setBadgeBackgroundColor({ color: null });
  });

  WebsocketService.instance.init();
}

export function initBackgroundService() {
  initWebsocketService();
  BackgroundBrowserEventListener.instance.startListeners();
}
