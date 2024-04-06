import { globalShortcut, screen } from 'electron';
import { GLOBAL_SHORTCUTS } from './constant';
import WindowsManager from '../window/WindowsManager';
import { centerWindow } from './helper';
import { COMMNAND_WINDOW_BOUND } from '../window/command-window';

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

    centerWindow(commandWindow, display, {
      width: COMMNAND_WINDOW_BOUND.width,
      height: COMMNAND_WINDOW_BOUND.maxHeight,
    });

    if (isHidden) commandWindow.show();
  });
}

export function registerGlobalShortcuts() {
  registerCommandWindowShortcut();
}
