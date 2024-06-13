import { sleep } from '@alt-dot/shared';
import ExtensionIPCEvent from '../ExtensionIPCEvent';
import WindowCommand from '../../../window/command-window';

ExtensionIPCEvent.instance.on('mainWindow.close', async () => {
  await WindowCommand.instance.toggleWindow(false);
  await sleep(1000);
});
