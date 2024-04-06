import { globalShortcut, screen } from 'electron';
import { GLOBAL_SHORTCUTS } from './constant';
import WindowsManager from '../window/WindowsManager';
import { centerWindow } from './helper';

function registerCommandWindowShortcut() {
  globalShortcut.register(GLOBAL_SHORTCUTS.toggleCommandWindow, () => {
    const commandWindow = WindowsManager.instance.getWindow('command', {
      noThrow: true,
    });
    if (!commandWindow) return;

    const isHidden = WindowsManager.instance.isWindowHidden('command');
    if (!isHidden) {
      commandWindow.hide();
      return;
    }

    const cursorPosition = screen.getCursorScreenPoint();
    const display = screen.getDisplayNearestPoint(cursorPosition);

    centerWindow(commandWindow, display);

    if (isHidden) commandWindow.show();
  });
}

export function registerGlobalShortcuts() {
  registerCommandWindowShortcut();
}
