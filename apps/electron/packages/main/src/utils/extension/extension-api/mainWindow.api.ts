import { onExtensionIPCEvent } from '../extension-api-event';
import { toggleCommandWindow } from '/@/window/command-window';

onExtensionIPCEvent('mainWindow.close', () => {
  toggleCommandWindow(false);
  return Promise.resolve();
});
