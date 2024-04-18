import path from 'path';
import InstalledApps from '../../InstalledApps';
import { onExtensionIPCEvent } from '../extension-api-event';
import { logger } from '/@/lib/log';
import { shell } from 'electron';
import { ExtensionError } from '#packages/common/errors/custom-errors';

onExtensionIPCEvent('shell.installedApps.query', async (_, query) => {
  const apps = await InstalledApps.instance.getApps();

  if (query instanceof RegExp) {
    return apps.filter((app) => query.test(app.name));
  }

  if (!query.trim()) return apps;

  if (query.startsWith('startsWith:')) {
    return apps.filter((app) => app.name.startsWith(query));
  } else if (query.startsWith('endsWith:')) {
    return apps.filter((app) => app.name.endsWith(query));
  }

  return apps.filter((app) => app.name.includes(query));
});

onExtensionIPCEvent('shell.installedApps.launch', async (_, appId) => {
  try {
    await InstalledApps.instance.launchApp(appId);

    return true;
  } catch (error) {
    const appTarget = InstalledApps.instance.getAppPath(appId);
    logger(
      'error',
      ['installedApps.launch'],
      `Failed to launch "${path.basename(appTarget?.target || '')}" (${(error as Error).message})`,
    );

    return false;
  }
});

onExtensionIPCEvent('shell.installedApps.showInFolder', async (_, appId) => {
  const appPath = InstalledApps.instance.getAppPath(appId);
  if (!appPath) {
    throw new ExtensionError(`Couldn't find installed with "${appId}" appId`);
  }

  shell.showItemInFolder(
    appPath.isUrlShortcut ? appPath.shortcutPath : appPath.target,
  );
});

onExtensionIPCEvent('shell.moveToTrash', async (_, itemPath) => {
  const itemPaths = Array.isArray(itemPath) ? itemPath : [itemPath];
  await Promise.all(itemPaths.map((item) => shell.trashItem(item)));
});

onExtensionIPCEvent('shell.showItemInFolder', (_, itemPath) => {
  shell.showItemInFolder(itemPath);

  return Promise.resolve();
});

onExtensionIPCEvent('shell.openURL', (_, url) => {
  if (!url.startsWith('http')) {
    throw new ExtensionError('Invalid URL');
  }

  shell.openExternal(url);

  return Promise.resolve();
});
