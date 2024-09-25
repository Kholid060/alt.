import type { NativeImage } from 'electron';
import { shell, app, nativeImage } from 'electron';
import { globby } from 'globby';
import path from 'path';
import { nanoid } from 'nanoid/non-secure';
import type { ExtensionAPI } from '@altdot/extension';
import type { BrowserApp } from '#packages/common/interface/ipc-events.interface';
import { Injectable } from '@nestjs/common';
import {
  browserDetail,
  browserRegex,
  extractShortcutDetail,
  programShortcutDirs,
  resolveEnvDir,
} from './utils/installed-apps-util';

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
    await Promise.all(
      shortcuts.map(async (shortcut) => {
        try {
          const appDetail = await extractShortcutDetail(shortcut);
          if (!appDetail?.target || seenApps.has(appDetail.target)) return;

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

          this.apps.push({
            appId,
            name: appDetail.name,
            path: appDetail.path,
            description: appDetail.description,
            isInternetShortcut: appDetail.isUrlShortcut,
          });
        } catch {
          // do nothing
        }
      }),
    );

    this.apps = this.apps.sort((a, b) =>
      a.name.toLowerCase() > b.name.toLowerCase() ? 1 : -1,
    );
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

    return shell.openPath(appPath.target);
  }
}
