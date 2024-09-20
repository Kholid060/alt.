import { BrowserType } from '@altdot/shared';
import { app, shell } from 'electron';
import path from 'path';
import fs from 'fs-extra';
import { InstalledAppDetail } from '../installed-apps.interface';

export const programShortcutDirs = [
  '%APPDATA%/Microsoft/Windows/Start Menu/Programs',
  '%PROGRAMDATA%/Microsoft/Windows/Start Menu/Programs',
  app.getPath('desktop'),
  path.join(app.getPath('desktop'), '../../Public/Desktop')
];

export function resolveEnvDir(dir: string) {
  let isNoEnv = false;

  const resolveDir = dir.replaceAll(/%([^%]+)%/g, (_, match: string) => {
    if (Object.hasOwn(process.env, match)) return process.env[match]!;

    isNoEnv = true;

    return '';
  });

  return isNoEnv ? null : resolveDir;
}

export async function readURLShortcut(path: string) {
  try {
    const detail = await fs.readFile(path, 'utf8');
    const props = detail.split('\n');

    if (props.length === 0) return null;

    const shortcutDetail: Omit<InstalledAppDetail, 'name'> = {
      path: '',
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

export async function extractShortcutDetail(shortcut: string) {
  const fileExt = path.extname(shortcut);
  const filename = path.basename(shortcut).replace(fileExt, '');

  try {
    let appDetail: InstalledAppDetail = {
      path: '',
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
          path: shortcut,
          isUrlShortcut: true,
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
        path: target,
      };
    }

    return appDetail;
  } catch (_error) {
    // Do nothing
  }

  return null;
}

export const browserDetail: { name: string; filename: string; type: BrowserType }[] = [
  { name: 'Firefox', filename: 'firefox.exe', type: 'firefox' },
  { name: 'Microsoft Edge', filename: 'msedge.exe', type: 'edge' },
  { name: 'Google Chrome', filename: 'chrome.exe', type: 'chrome' },
];
export const browserRegex = /firefox|chrome|edge/i;
