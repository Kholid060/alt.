import { Notification } from 'electron';
import { MESSAGE_PORT_CHANNEL_IDS } from '#packages/common/utils/constant/constant';
import IPCMain from './IPCMain';
import WindowsManager from '/@/window/WindowsManager';
import WindowCommand from '../../window/command-window';
import ExtensionService from '/@/services/extension.service';

IPCMain.on('dashboard-window:open', (_, path) => {
  WindowsManager.instance.restoreOrCreateWindow('dashboard').then((window) => {
    WindowsManager.instance.sendMessageToWindow(
      window,
      'dashboard-window:open',
      path,
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

IPCMain.on('extension:stop-execute-command', (_, runnerId) => {
  ExtensionService.instance.stopCommandExecution(runnerId);
  return Promise.resolve();
});

IPCMain.on('app:show-notification', (_, { title, body, silent, subtitle }) => {
  const notification = new Notification({
    body,
    silent,
    title,
    subtitle,
  });
  notification.show();
});

IPCMain.on('command-window:input-config', (_, payload) => {
  WindowCommand.instance.toggleWindow(true);
  WindowsManager.instance.sendMessageToWindow(
    'command',
    'command-window:input-config',
    payload,
  );
});
