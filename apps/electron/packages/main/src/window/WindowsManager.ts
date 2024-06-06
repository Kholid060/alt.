import WindowCommand from './command-window';
import WindowDashboard from './dashboard-window';
import WindowSharedProcess from './shared-process-window';
import type { WindowNames } from '#packages/common/interface/window.interface';
import type WindowBase from './WindowBase';
import type { IPCRendererSendEvent } from '#packages/common/interface/ipc-events.interface';
import type { WindowMessageName } from './WindowBase';
import { WindowBaseState } from './WindowBase';

const windows: Record<WindowNames, WindowBase> = {
  command: WindowCommand.instance,
  dashboard: WindowDashboard.instance,
  'shared-process': WindowSharedProcess.instance,
};

class WindowsManager {
  static getAll() {
    return Object.values(windows);
  }

  static getWindow(name: WindowNames, options?: { noThrow: false }): WindowBase;
  static getWindow(
    name: WindowNames,
    options?: { noThrow: true },
  ): WindowBase | null;
  static getWindow(
    name: WindowNames,
    options?: { noThrow: boolean },
  ): WindowBase | null {
    const browserWindow = windows[name];
    if (!browserWindow) {
      if (options?.noThrow) return null;
      throw new Error('Invalid window id');
    }

    return browserWindow;
  }

  static sendMessageToAllWindows<T extends keyof IPCRendererSendEvent>({
    name,
    args,
    excludeWindow,
  }: {
    name: T | WindowMessageName<T>;
    args: IPCRendererSendEvent[T];
    excludeWindow?: (WindowNames | number)[];
  }) {
    WindowsManager.getAll().forEach((browserWindow) => {
      if (
        browserWindow.state === WindowBaseState.Closed ||
        (excludeWindow &&
          (excludeWindow.includes(browserWindow.windowId) ||
            excludeWindow.includes(browserWindow.webContentId)))
      )
        return;

      browserWindow.sendMessage(name, ...args);
    });
  }
}

export default WindowsManager;
