import { onExtensionIPCEvent } from '../extension-api-event';
import WindowsManager from '/@/window/WindowsManager';

onExtensionIPCEvent('mainWindow.close', () => {
  const commandWindow = WindowsManager.instance.getWindow('command');
  commandWindow.blur();
  commandWindow.hide();

  return Promise.resolve();
});
