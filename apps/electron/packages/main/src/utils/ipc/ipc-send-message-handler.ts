import { onIpcSendMessage } from './ipc-main';
import WindowsManager from '/@/window/WindowsManager';

onIpcSendMessage('window:open-settings', (_, routePath) => {
  WindowsManager.instance.restoreOrCreateWindow('dashboard').then((window) => {
    if (!routePath) return;

    WindowsManager.instance.sendMessageToWindow(
      window,
      'app:update-route',
      routePath,
    );
  });
});

onIpcSendMessage('window:open-command', (_, routePath) => {
  WindowsManager.instance.restoreOrCreateWindow('command').then((window) => {
    if (!routePath) return;

    WindowsManager.instance.sendMessageToWindow(
      window,
      'app:update-route',
      routePath,
    );
  });
});

onIpcSendMessage('data:changes', ({ sender }, ...args) => {
  WindowsManager.instance.sendMessageToAllWindows({
    args,
    name: 'data:changes',
    excludeWindow: [sender.id],
  });
});

onIpcSendMessage('command-window:input-config', (_, detail) => {
  const commandWindow = WindowsManager.instance.getWindow('command');
  commandWindow.focus();

  WindowsManager.instance.sendMessageToWindow(
    commandWindow,
    'command-window:input-config',
    detail,
  );
});
