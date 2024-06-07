import WebsocketService from '@root/src/service/websocket.service';
import BackgroundTabManager from './BackgroundTabManager';
import Browser from 'webextension-polyfill';

export async function initWebsocketService() {
  WebsocketService.instance.addListener('connect', () => {
    BackgroundTabManager.instance.init();
    Browser.action.setBadgeText({ text: ' ' });
    Browser.action.setBadgeBackgroundColor({ color: '#6E56CF' });
  });
  WebsocketService.instance.addListener('disconnect', () => {
    BackgroundTabManager.instance.destroy();
    Browser.action.setBadgeText({ text: null });
    Browser.action.setBadgeBackgroundColor({ color: null });
  });

  WebsocketService.instance.init();
}
