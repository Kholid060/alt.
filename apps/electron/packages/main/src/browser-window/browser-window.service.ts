import { Injectable } from '@nestjs/common';
import { WindowBaseState } from './window/WindowBase';
import { IPCRendererSendEvent } from '#packages/common/interface/ipc-events.interface';
import WindowDashboard from './window/WindowDashboard';
import WindowCommand from './window/WindowCommand';
import { OnAppReady } from '../common/hooks/on-app-ready.hook';
import { GlobalShortcutService } from '../global-shortcut/global-shortcut.service';
import { BrowserWindow, WebContents } from 'electron';
import { GLOBAL_SHORTCUTS } from '../common/utils/constant';
import { LoggerService } from '../logger/logger.service';
import { sleep } from '@altdot/shared';

interface BrowserWindowMap {
  command: WindowCommand;
  dashboard: WindowDashboard;
}

const browserWindowMap = {
  command: WindowCommand,
  dashboard: WindowDashboard,
};

type WindowNames = keyof BrowserWindowMap;

@Injectable()
export class BrowserWindowService implements OnAppReady {
  private windows: Map<WindowNames, BrowserWindowMap[WindowNames]> = new Map();

  constructor(
    private globalShortcut: GlobalShortcutService,
    private loggerService: LoggerService,
  ) {}

  async onAppReady() {
    const windowCommand = await this.getOrCreate('command');
    this.globalShortcut.register({
      keys: GLOBAL_SHORTCUTS.toggleCommandWindow,
      callback: () => windowCommand.toggleWindow(),
    });

    windowCommand.toggleWindow(true);
  }

  getAll() {
    return [...this.windows.values()];
  }

  has(name: WindowNames) {
    return this.windows.has(name);
  }

  async getOrCreate<T extends WindowNames>(
    name: T,
  ): Promise<BrowserWindowMap[T]> {
    let browserWindow = this.get(name);
    if (!browserWindow) {
      browserWindow = new browserWindowMap[name](
        this.loggerService,
      ) as BrowserWindowMap[T];
      if (!browserWindow) {
        throw new Error('Invalid window name');
      }

      await browserWindow.createWindow();
      browserWindow.window?.once('close', () => {
        // eslint-disable-next-line drizzle/enforce-delete-with-where
        this.windows.delete(name);
      });

      this.windows.set(name, browserWindow);
    }

    return browserWindow;
  }

  get<T extends WindowNames>(name: T): BrowserWindowMap[T] | null {
    return (this.windows.get(name) as BrowserWindowMap[T]) ?? null;
  }

  async destroy(name: WindowNames) {
    if (!this.windows.has(name)) return;

    const window = this.windows.get(name);
    window?.destroy();
  }

  async open(name: WindowNames, routePath?: string) {
    const browserWindow = await this.getOrCreate(name);
    await browserWindow.restoreOrCreateWindow();
    await sleep(125);
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
    name: T;
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
