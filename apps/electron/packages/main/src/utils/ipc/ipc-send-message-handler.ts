import { Notification } from 'electron';
import { MESSAGE_PORT_CHANNEL_IDS } from '#packages/common/utils/constant/constant';
import IPCMain from './IPCMain';
import WindowsManager from '/@/window/WindowsManager';
import WindowCommand from '../../window/command-window';
import ExtensionService from '/@/services/extension.service';
import WindowDashboard from '/@/window/dashboard-window';

IPCMain.on('data:changes', ({ sender }, ...args) => {
  WindowsManager.sendMessageToAllWindows({
    args,
    name: 'data:changes',
    excludeWindow: [sender.id],
  });
});

IPCMain.on('message-port:port-bridge', ({ ports }, channelId) => {
  if (ports.length === 0) return;

  switch (channelId) {
    case MESSAGE_PORT_CHANNEL_IDS.sharedWithCommand:
      WindowCommand.instance.postMessage(
        'message-port:created',
        { channelId },
        ports,
      );
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

IPCMain.on('shared-process:workflow-events', (_, events) => {
  WindowDashboard.instance.sendMessage(
    {
      noThrow: true,
      ensureWindow: false,
      name: 'shared-process:workflow-events',
    },
    events,
  );
});
