import { MESSAGE_PORT_CHANNEL_IDS } from '#packages/common/utils/constant/constant';
import IPCMain from './IPCMain';
import SharedProcessService from '/@/services/shared-process.service';
import WindowsManager from '/@/window/WindowsManager';

IPCMain.on('window:open-settings', (_, routePath) => {
  WindowsManager.instance.restoreOrCreateWindow('dashboard').then((window) => {
    if (!routePath) return;

    WindowsManager.instance.sendMessageToWindow(
      window,
      'app:update-route',
      routePath,
    );
  });
});

IPCMain.on('window:open-command', (_, routePath) => {
  WindowsManager.instance.restoreOrCreateWindow('command').then((window) => {
    if (!routePath) return;

    WindowsManager.instance.sendMessageToWindow(
      window,
      'app:update-route',
      routePath,
    );
  });
});

IPCMain.on('data:changes', ({ sender }, ...args) => {
  WindowsManager.instance.sendMessageToAllWindows({
    args,
    name: 'data:changes',
    excludeWindow: [sender.id],
  });
});

IPCMain.on('message-port:port-bridge', ({ ports }, channelId) => {
  if (ports.length === 0) return;

  switch (channelId) {
    case MESSAGE_PORT_CHANNEL_IDS.sharedWithCommand:
      IPCMain.postMessageToWindow('command', {
        ports: ports,
        data: { channelId },
        name: 'message-port:created',
      });
      break;
  }
});

IPCMain.on('extension:stop-execute-command', (_, processId) => {
  SharedProcessService.stopExecuteExtensionCommand(processId);
  return Promise.resolve();
});
