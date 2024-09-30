import { Injectable } from '@nestjs/common';
import { OnAppReady } from '../common/hooks/on-app-ready.hook';
import { BrowserWindowService } from '../browser-window/browser-window.service';
import { Menu, Tray, nativeImage, shell } from 'electron';
import { LoggerService } from '../logger/logger.service';
import { fileURLToPath } from 'url';

@Injectable()
export class TrayMenuService implements OnAppReady {
  private tray: Tray | null = null;

  constructor(
    private logger: LoggerService,
    private browserWindow: BrowserWindowService,
  ) {}

  onAppReady() {
    this.tray = new Tray(
      nativeImage.createFromPath(
        fileURLToPath(
          new URL('./../../../buildResources/icon.ico', import.meta.url),
        ),
      ),
    );

    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Command',
        click: () => {
          this.logger.wrap(['tray', 'command-menu'], async () => {
            const windowCommand =
              await this.browserWindow.getOrCreate('command');
            await windowCommand.toggleWindow(true);
          });
        },
      },
      {
        label: 'Dashboard',
        click: () => {
          this.logger.wrap(['tray', 'dashboard-menu'], async () => {
            const windowDashboard =
              await this.browserWindow.getOrCreate('dashboard');
            await windowDashboard.restoreOrCreateWindow();
          });
        },
      },
      {
        type: 'separator',
      },
      {
        label: 'Website',
        click() {
          shell.openExternal('https://altdot.app');
        },
      },
      {
        label: 'Documentation',
        click() {
          shell.openExternal('https://docs.altdot.app');
        },
      },
      {
        label: 'Report bug',
        click() {
          shell.openExternal(
            'https://github.com/Kholid060/alt./issues/new/choose',
          );
        },
      },
      {
        type: 'separator',
      },
      {
        role: 'quit',
      },
    ]);

    this.tray.addListener('double-click', () => {
      this.logger.wrap(['tray', 'double-click'], async () => {
        const windowDashboard =
          await this.browserWindow.getOrCreate('dashboard');
        await windowDashboard.restoreOrCreateWindow();
      });
    });

    this.tray.setToolTip('alt.');
    this.tray.setContextMenu(contextMenu);
  }

  setTooltip(content: string) {
    this.tray?.setToolTip(content);
  }
}
