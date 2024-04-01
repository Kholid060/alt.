import WebsocketService from '@root/src/service/websocket.service';
import BackgroundTabManager from './BackgroundTabManager';

export async function initWebsocketService() {
  WebsocketService.instance.addListener('connect', () => {
    BackgroundTabManager.instance.init();
  });
  WebsocketService.instance.addListener('disconnect', () => {
    BackgroundTabManager.instance.destroy();
  });

  WebsocketService.instance.init();
}
