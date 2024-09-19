import type { NativeImage } from 'electron';
import { shell, app, nativeImage } from 'electron';
import fs from 'fs-extra';
import { globby } from 'globby';
import path from 'path';
import { nanoid } from 'nanoid/non-secure';
import type { ExtensionAPI } from '@altdot/extension';
import type { BrowserApp } from '#packages/common/interface/ipc-events.interface';
import type { BrowserType } from '@altdot/shared';
import { Injectable } from '@nestjs/common';

interface InstalledAppDetail
  extends Pick<
    Electron.ShortcutDetails,
    'description' | 'target' | 'icon' | 'iconIndex'
  > {
  name: string;
  isUrlShortcut: boolean;
}

const programShortcutDirs = [
  '%APPDATA%/Microsoft/Windows/Start Menu/Programs',
  '%PROGRAMDATA%/Microsoft/Windows/Start Menu/Programs',
  app.getPath('desktop'),
];

function resolveEnvDir(dir: string) {
  let isNoEnv = false;

  const resolveDir = dir.replaceAll(/%([^%]+)%/g, (_, match: string) => {
    if (Object.hasOwn(process.env, match)) return process.env[match]!;

    isNoEnv = true;

    return '';
  });

  return isNoEnv ? null : resolveDir;
}

async function readURLShortcut(path: string) {
  try {
    const detail = await fs.readFile(path, 'utf8');
    const props = detail.split('\n');

    if (props.length === 0) return null;

    const shortcutDetail: Omit<InstalledAppDetail, 'name'> = {
      target: '',
      description: '',
      isUrlShortcut: false,
    };

    for (const keyValueStr of props) {
      const [key, value] = keyValueStr.split('=');

      switch (key) {
        case 'IconIndex':
          shortcutDetail.iconIndex = Number.isNaN(+value) ? undefined : +value;
          break;
        case 'URL':
          shortcutDetail.target = value;
          break;
        case 'IconFile':
          shortcutDetail.icon = resolveEnvDir(value)?.trim() ?? undefined;
          break;
      }
    }

    if (!shortcutDetail.target.trim()) return null;

    return shortcutDetail;
  } catch (error) {
    console.error(error);
    return null;
  }
}

async function extractShortcutDetail(shortcut: string) {
  const fileExt = path.extname(shortcut);
  const filename = path.basename(shortcut).replace(fileExt, '');

  try {
    let appDetail: InstalledAppDetail = {
      target: '',
      name: filename,
      isUrlShortcut: false,
    };

    if (fileExt == '.url') {
      const urlShortcutDetail = await readURLShortcut(shortcut);
      if (urlShortcutDetail) {
        appDetail = {
          ...appDetail,
          ...urlShortcutDetail,
          isUrlShortcut: true,
        };
      }
    } else {
      if (shortcut.includes('Visual Studio Code')) throw new Error('Make the app crash!!!');

      const { target, icon, description, iconIndex } =
        shell.readShortcutLink(shortcut);
      appDetail = {
        ...appDetail,
        icon,
        target,
        iconIndex,
        description,
      };
    }

    return appDetail;
  } catch (_error) {
    // Do nothing
  }

  return null;
}

const browserDetail: { name: string; filename: string; type: BrowserType }[] = [
  { name: 'Firefox', filename: 'firefox.exe', type: 'firefox' },
  { name: 'Microsoft Edge', filename: 'msedge.exe', type: 'edge' },
  { name: 'Google Chrome', filename: 'chrome.exe', type: 'chrome' },
];
const browserRegex = /firefox|chrome|edge/i;

@Injectable()
export class InstalledAppsService {
  private isAppsFetched: boolean = false;
  private apps: ExtensionAPI.Shell.InstalledApps.AppDetail[] = [];
  private appPaths: Map<
    string,
    {
      target: string;
      iconPath?: string;
      shortcutPath: string;
      isUrlShortcut: boolean;
    }
  > = new Map();
  private browsers: BrowserApp[] = [];

  constructor() {}

  private async fetchApps() {
    const shortcutDirs = programShortcutDirs.reduce<string[]>((acc, str) => {
      const dir = resolveEnvDir(str);
      if (dir)
        acc.push(path.join(dir, '/**/*.{lnk,url}').replaceAll('\\', '/'));

      return acc;
    }, []);

    const seenApps = new Set<string>();

    const shortcuts = await globby(shortcutDirs);
    const appPromise = await Promise.allSettled<
      Promise<ExtensionAPI.Shell.InstalledApps.AppDetail | null>[]
    >(
      shortcuts.map(async (shortcut) => {
        const appDetail = await extractShortcutDetail(shortcut);
        if (!appDetail?.target || seenApps.has(appDetail.target)) return null;

        const appId = nanoid(5);
        seenApps.add(appDetail.target);

        let iconPath: string | undefined;

        if (appDetail.icon?.endsWith('.ico')) {
          iconPath = appDetail.icon;
        }

        this.appPaths.set(appId, {
          iconPath,
          shortcutPath: shortcut,
          target: appDetail.target,
          isUrlShortcut: appDetail.isUrlShortcut,
        });

        if (browserRegex.test(appDetail.name)) {
          const browser = browserDetail.find((browser) => {
            return path.basename(appDetail.target) === browser.filename;
          });
          if (browser) {
            this.browsers.push({
              name: browser.name,
              type: browser.type,
              location: appDetail.target,
            });
          }
        }

        return {
          appId,
          name: appDetail.name,
          path: appDetail.target,
          description: appDetail.description,
          isInternetShortcut: appDetail.isUrlShortcut,
        };
      }),
    );

    this.apps = appPromise
      .reduce<ExtensionAPI.Shell.InstalledApps.AppDetail[]>((acc, curr) => {
        if (curr.status === 'fulfilled' && curr.value) {
          acc.push(curr.value);
        }

        return acc;
      }, [])
      .sort((a, b) => (a.name.toLowerCase() > b.name.toLowerCase() ? 1 : -1));
    this.isAppsFetched = true;
  }

  async getApps() {
    if (this.isAppsFetched) return this.apps;

    await this.fetchApps();

    return this.apps;
  }

  async getBrowsers() {
    if (this.isAppsFetched) return this.browsers;

    await this.fetchApps();

    return this.browsers;
  }

  getAppPath(appId: string) {
    return this.appPaths.get(appId);
  }

  async getAppIcon(appId: string): Promise<null | NativeImage> {
    const appPath = this.appPaths.get(appId);
    if (!appPath) return null;

    if (appPath.iconPath) {
      return nativeImage.createFromPath(appPath.iconPath);
    }

    return await app.getFileIcon(
      appPath.isUrlShortcut ? appPath.shortcutPath : appPath.target,
    );
  }

  launchApp(appId: string) {
    const appPath = this.appPaths.get(appId);
    if (!appPath) throw new Error("Can't find app");

    return shell.openExternal(appPath.target, {
      workingDirectory: app.getPath('desktop'),
    });
  }
}
