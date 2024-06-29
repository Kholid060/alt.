import { Injectable } from '@nestjs/common';
import { WindowMessageName } from '../window/WindowBase';
import { WindowBaseState } from './window/WindowBase';
import { IPCRendererSendEvent } from '#packages/common/interface/ipc-events.interface';
import WindowDashboard from './window/WindowDashboard';
import WindowSharedProcess from './window/WindowSharedProcess';
import WindowCommand from './window/WindowCommand';
import { OnAppReady } from '../common/hooks/on-app-ready.hook';
import { GlobalShortcutService } from '../global-shortcut/global-shortcut.service';
import { GLOBAL_SHORTCUTS } from '../utils/constant';
import { BrowserWindow, WebContents } from 'electron';

interface BrowserWindowMap {
  command: WindowCommand;
  dashboard: WindowDashboard;
  'shared-process': WindowSharedProcess;
}

const browserWindowMap = {
  command: WindowCommand,
  dashboard: WindowDashboard,
  'shared-process': WindowSharedProcess,
};

type WindowNames = keyof BrowserWindowMap;

@Injectable()
export class BrowserWindowService implements OnAppReady {
  private windows: Map<WindowNames, BrowserWindowMap[WindowNames]> = new Map();

  constructor(private globalShortcut: GlobalShortcutService) {}

  async onAppReady() {
    const windowCommand = await this.get('command');
    this.globalShortcut.register({
      keys: GLOBAL_SHORTCUTS.toggleCommandWindow,
      callback: () => windowCommand.toggleWindow(),
    });
  }

  getAll() {
    return [...this.windows.values()];
  }

  has(name: WindowNames) {
    return this.windows.has(name);
  }

  async get<T extends WindowNames>(
    name: T,
    options?: { autoCreate: false; noThrow?: false },
  ): Promise<BrowserWindowMap[T]>;
  async get<T extends WindowNames>(
    name: T,
    options?: { autoCreate: true; noThrow?: true },
  ): Promise<BrowserWindowMap[T]>;
  async get<T extends WindowNames>(
    name: T,
    options?: { autoCreate: false; noThrow: true },
  ): Promise<BrowserWindowMap[T] | null>;
  async get<T extends WindowNames>(
    name: T,
    {
      noThrow = false,
      autoCreate = true,
    }: { autoCreate?: boolean; noThrow?: boolean } = {},
  ): Promise<BrowserWindowMap[T]> {
    if (!Object.hasOwn(browserWindowMap, name)) {
      throw new Error('Invalid window name');
    }

    let browserWindow = (this.windows.get(name) as BrowserWindowMap[T]) ?? null;
    if (browserWindow) return browserWindow;

    browserWindow = new browserWindowMap[name]() as BrowserWindowMap[T];
    this.windows.set(name, browserWindow);

    if (autoCreate) {
      await browserWindow.createWindow();
    } else if (!noThrow) {
      throw new Error(`Can't access "${name}" window before created`);
    }

    return browserWindow;
  }

  async destroy(name: WindowNames) {
    if (!this.windows.has(name)) return;

    const window = this.windows.get(name);
    window?.destroy();
  }

  async open(name: WindowNames, routePath?: string) {
    const browserWindow = await this.get(name);
    await browserWindow.restoreOrCreateWindow();
    if (routePath) browserWindow.sendMessage('app:update-route', routePath);
  }

  toggleLock(window: BrowserWindow | WebContents) {
    const browserWindow =
      window instanceof BrowserWindow
        ? window
        : BrowserWindow.fromWebContents(window);
    if (!browserWindow) return Promise.resolve();

    const isLocked = !browserWindow.isAlwaysOnTop();
    browserWindow.setResizable(isLocked);
    browserWindow.setSkipTaskbar(!isLocked);
    browserWindow.setAlwaysOnTop(isLocked, 'modal-panel');
  }

  sendMessageToAllWindows<T extends keyof IPCRendererSendEvent>({
    name,
    args,
    excludeWindow,
  }: {
    name: T | WindowMessageName<T>;
    args: IPCRendererSendEvent[T];
    excludeWindow?: (WindowNames | number)[];
  }) {
    this.windows.forEach((browserWindow) => {
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
