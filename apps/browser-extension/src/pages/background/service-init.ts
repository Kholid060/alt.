import BrowserService from '@root/src/service/browser.service';
import WebsocketService from '@root/src/service/websocket.service';
import Browser from 'webextension-polyfill';
import BackgroundBrowserEventListener from './BackgroundBrowserEventListener';

function initWebsocketService() {
  WebsocketService.instance.addListener('connect', () => {
    BrowserService.instance.startListener();
    Browser.action.setBadgeText({ text: ' ' });
    Browser.action.setBadgeBackgroundColor({ color: '#6E56CF' });
  });
  WebsocketService.instance.addListener('disconnect', () => {
    BrowserService.instance.stopListener();
    Browser.action.setBadgeText({ text: '' });
    Browser.action.setBadgeBackgroundColor({ color: '' });
  });

  WebsocketService.instance.init();
}

export function initBackgroundService() {
  initWebsocketService();
  BackgroundBrowserEventListener.instance.startListeners();
}
