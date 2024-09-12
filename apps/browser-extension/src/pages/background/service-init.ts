import BrowserService from '@root/src/service/browser.service';
import WebsocketService from '@root/src/service/websocket.service';
import Browser from 'webextension-polyfill';
import BackgroundBrowserEventListener from './BackgroundBrowserEventListener';
import { IS_FIREFOX } from '@root/src/utils/constant/constant';

function initWebsocketService() {
  WebsocketService.instance.addListener('connect', async () => {
    BrowserService.instance.startListener();
    await Browser.action.setBadgeText({ text: ' ' });
    await Browser.action.setBadgeBackgroundColor({ color: '#6E56CF' });
  });
  WebsocketService.instance.addListener('disconnect', async () => {
    BrowserService.instance.stopListener();
    await Browser.action.setBadgeText({ text: '' });
    await Browser.action.setBadgeBackgroundColor({
      color: IS_FIREFOX ? null : '',
    });
  });

  WebsocketService.instance.init();
}

export async function initBackgroundService() {
  BackgroundBrowserEventListener.instance.startListeners();
  initWebsocketService();
}
