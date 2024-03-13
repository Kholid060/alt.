import path from 'path';
import InstalledApps from '../../InstalledApps';
import { onExtensionIPCEvent } from '../extension-api-event';
import { logger } from '/@/lib/log';

onExtensionIPCEvent('installedApps.query', async (_, query) => {
  const apps = await InstalledApps.instance.getList();

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

onExtensionIPCEvent('installedApps.launch', async (_, appId) => {
  try {
    await InstalledApps.instance.launchApp(appId);

    return true;
  } catch (error) {
    const appTarget = InstalledApps.instance.getAppTarget(appId);
    logger(
      'error',
      ['installedApps.launch'],
      `Failed to launch "${path.basename(appTarget || '')}" (${(error as Error).message})`,
    );

    return false;
  }
});
