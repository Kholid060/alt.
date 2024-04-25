import { screen } from 'electron';
import { store } from '../lib/store';
import type { WindowManagerWindowNames } from './WindowsManager';

class WindowUtils {
  constructor(private windowId: WindowManagerWindowNames) {}

  saveWindowBounds(bounds: Electron.Rectangle) {
    store.set(`windowBounds.${this.windowId}`, bounds);
  }

  getWindowBounds() {
    const bounds = store.get(
      `windowBounds.${this.windowId}`,
      null,
    ) as Electron.Rectangle | null;
    if (!bounds) return null;

    const display = screen.getDisplayNearestPoint({
      x: bounds.x,
      y: bounds.y,
    });

    if (
      !(bounds.x > display.bounds.x && bounds.x < display.size.width) ||
      !(bounds.y > display.bounds.y && bounds.y < display.size.height)
    ) {
      bounds.x = display.bounds.x;
      bounds.y = display.bounds.y;
    }

    return bounds;
  }
}

export default WindowUtils;
