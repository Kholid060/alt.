import reloadOnUpdate from 'virtual:reload-on-update-in-background-script';
import { initWebsocketService } from './service-init';

reloadOnUpdate('pages/background');

initWebsocketService();

console.log('background loaded');
