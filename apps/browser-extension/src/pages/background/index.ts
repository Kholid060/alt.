import WebsocketService from '@root/src/service/websocket.service';
import reloadOnUpdate from 'virtual:reload-on-update-in-background-script';
import BackgroundTabManager from './BackgroundTabManager';

reloadOnUpdate('pages/background');

WebsocketService.instance.init().then(() => {
  BackgroundTabManager.instance.init();
});

console.log('background loaded');
