import type { InstalledAppDetail } from '#common/interface/installed-apps';
import type { NativeImage } from 'electron';
import { shell, app } from 'electron';
import fs from 'fs-extra';
import { globby } from 'globby';
import path from 'path';
import { nanoid } from 'nanoid/non-secure';
import { APP_ICON_DIR } from './constant';
import { store } from '../lib/store';
import dayjs from 'dayjs';
import type ExtensionAPI from '@repo/extension-core/types/extension-api';

const MAX_CACHE_AGE_DAY = 7;

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
      icon: '',
      target: '',
      description: '',
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
          shortcutDetail.icon = value;
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
    };

    if (fileExt == '.url') {
      const urlShortcutDetail = await readURLShortcut(shortcut);
      if (urlShortcutDetail) {
        appDetail = {
          ...appDetail,
          ...urlShortcutDetail,
        };
      }
    } else {
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

async function getAppIcon({
  icon,
  appId,
  appPath,
}: {
  icon: string;
  appId: string;
  appPath: string;
}) {
  try {
    let appIcon: NativeImage | null = null;

    const iconExt = path.extname(icon);
    if (iconExt == '.ico') {
      const iconPath = resolveEnvDir(icon);

      if (!iconPath) {
        appIcon = await app.getFileIcon(appPath, { size: 'normal' });
      } else {
        await fs.copyFile(iconPath, path.join(APP_ICON_DIR, `${appId}.ico`));
        return `${appId}.ico`;
      }
    } else {
      appIcon = await app.getFileIcon(appPath, { size: 'normal' });
    }

    await fs.writeFile(
      path.join(APP_ICON_DIR, `${appId}.png`),
      appIcon.toPNG(),
    );

    return `${appId}.png`;
  } catch (error) {
    console.error(error);
    return null;
  }
}

class InstalledApps {
  private appTarget: Map<string, string> = new Map();

  static instance = new InstalledApps();

  constructor() {}

  async getList() {
    const storedData = store.get('installedApps');

    const useCache =
      storedData.fetchedAt &&
      dayjs().diff(storedData.fetchedAt, 'day') <= MAX_CACHE_AGE_DAY;
    if (useCache && storedData.list.length > 0) {
      if (this.appTarget.size === 0) {
        this.appTarget = new Map(
          storedData.list.map((app) => [
            app.appId,
            storedData.appsTarget[app.appId],
          ]),
        );
      }

      return storedData.list;
    }

    await fs.emptyDir(APP_ICON_DIR);

    const shortcutDirs = programShortcutDirs.reduce<string[]>((acc, str) => {
      const dir = resolveEnvDir(str);
      if (dir)
        acc.push(path.join(dir, '/**/*.{lnk,url}').replaceAll('\\', '/'));

      return acc;
    }, []);

    const seenApps = new Set<string>();
    const appsTarget: Record<string, string> = {};

    const shortcuts = await globby(shortcutDirs);
    const appPromise = await Promise.allSettled<
      Promise<ExtensionAPI.installedApps.AppDetail | null>[]
    >(
      shortcuts.map(async (shortcut) => {
        const appDetail = await extractShortcutDetail(shortcut);
        if (!appDetail?.target || seenApps.has(appDetail.target)) return null;

        const appId = nanoid(5);
        this.appTarget.set(appId, appDetail.target);

        seenApps.add(appDetail.target);

        const appIcon = await getAppIcon({
          appId,
          appPath: appDetail.target,
          icon: appDetail.icon ?? '',
        });
        appsTarget[appId] = appDetail.target;

        return {
          appId,
          name: appDetail.name,
          icon: appIcon ?? undefined,
          description: appDetail.description,
        };
      }),
    );

    const apps = appPromise
      .reduce<ExtensionAPI.installedApps.AppDetail[]>((acc, curr) => {
        if (curr.status === 'fulfilled' && curr.value) {
          acc.push(curr.value);
        }

        return acc;
      }, [])
      .sort((a, b) => (a.name.toLowerCase() > b.name.toLowerCase() ? 1 : -1));

    store.set('installedApps', {
      list: apps,
      appsTarget,
      fetchedAt: new Date().toISOString(),
    });

    return apps;
  }

  getAppTarget(appId: string) {
    console.log(appId, this.appTarget);
    return this.appTarget.get(appId);
  }

  launchApp(appId: string) {
    const target = this.appTarget.get(appId);
    if (!target) throw new Error("Can't find app");

    return shell.openExternal(target);
  }
}

export default InstalledApps;
