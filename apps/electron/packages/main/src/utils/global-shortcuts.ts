import { globalShortcut } from 'electron';
import { GLOBAL_SHORTCUTS } from './constant';
import { toggleCommandWindow } from '../window/command-window';

function registerCommandWindowShortcut() {
  globalShortcut.register(GLOBAL_SHORTCUTS.toggleCommandWindow, () => {
    toggleCommandWindow();
  });
}

export function registerGlobalShortcuts() {
  registerCommandWindowShortcut();
}
