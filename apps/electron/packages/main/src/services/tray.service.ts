import { Menu, Tray, nativeImage } from 'electron';
import { fileURLToPath } from 'url';
import WindowDashboard from '../window/dashboard-window';
import WindowCommand from '../window/command-window';

class TrayService {
  static instance = new TrayService();

  private tray: Tray | null = null;

  init() {
    if (this.tray) return;

    this.tray = new Tray(
      nativeImage.createFromPath(
        fileURLToPath(
          new URL('./../../../buildResources/icon.png', import.meta.url),
        ),
      ),
    );
    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Command',
        click: () => {
          WindowCommand.instance.toggleWindow(true);
        },
      },
      {
        label: 'Dashboard',
        click: () => {
          WindowDashboard.instance.restoreOrCreateWindow();
        },
      },
      {
        type: 'separator',
      },
      {
        label: 'Documentation',
      },
      {
        label: 'Report bug',
      },
      {
        type: 'separator',
      },
      {
        role: 'quit',
      },
    ]);

    this.tray.addListener('double-click', () => {
      WindowDashboard.instance.restoreOrCreateWindow();
    });

    this.tray.setToolTip('alt.');
    this.tray.setContextMenu(contextMenu);
  }

  setTooltip(content: string) {
    this.tray?.setToolTip(content);
  }
}

export default TrayService;
