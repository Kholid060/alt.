import IPCMain from './IPCMain';
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

IPCMain.on('command-window:input-config', (_, detail) => {
  const commandWindow = WindowsManager.instance.getWindow('command');
  commandWindow.focus();

  WindowsManager.instance.sendMessageToWindow(
    commandWindow,
    'command-window:input-config',
    detail,
  );
});
