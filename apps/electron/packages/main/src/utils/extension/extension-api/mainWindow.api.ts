import { sleep } from '@repo/shared';
import ExtensionIPCEvent from '../ExtensionIPCEvent';
import WindowCommand from '/@/window/command-window';

ExtensionIPCEvent.instance.on('mainWindow.close', () => {
  WindowCommand.instance.toggleWindow(false);
  return sleep(1000);
});
