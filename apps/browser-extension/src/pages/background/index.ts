import reloadOnUpdate from 'virtual:reload-on-update-in-background-script';
import { initBackgroundService } from './service-init';

reloadOnUpdate('pages/background');

initBackgroundService();

console.log('background loaded');
