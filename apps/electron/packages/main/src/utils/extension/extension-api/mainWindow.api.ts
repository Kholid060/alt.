import ExtensionIPCEvent from '../ExtensionIPCEvent';
import { toggleCommandWindow } from '/@/window/command-window';

ExtensionIPCEvent.instance.on('mainWindow.close', () => {
  toggleCommandWindow(false);
  return Promise.resolve();
});
