import type { IPCUserExtensionEventsMap } from '#common/interface/ipc-events';
import InstalledApps from './InstalledApps';
import { onIpcMessage } from './ipc-messages-handler';
import { isExtHasApiPermission } from '#common/utils/check-ext-permission';
import { ExtensionError } from '#common/errors/ExtensionError';
import ExtensionLoader from './extension/ExtensionLoader';
import { logger } from '../lib/log';
import path from 'path';

const onExtensionIPCEvent = (() => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handlers: Record<string, (...args: any[]) => any> = {};

  onIpcMessage('user-extension', async (sender, { args, key, name }) => {
    try {
      const extension = ExtensionLoader.instance.getExtensionByKey(key);
      if (
        !extension ||
        !isExtHasApiPermission(name, extension.manifest.permissions || [])
      ) {
        throw new ExtensionError("Doesn't have permission to access this API");
      }

      const handler = handlers[name];
      if (!handler) throw new Error(`"${name}" doesn't have handler`);

      const result = await handler(sender, ...args);

      return result;
    } catch (error) {
      if (error instanceof ExtensionError) {
        return {
          $isError: true,
          message: error.message,
        };
      }

      if (error instanceof Error) {
        console.error(error);
        logger('error', ['user-extension-handler', name], error.message);
      }

      return {
        $isError: true,
        message: 'Something went wrong',
      };
    }
  });

  return <
    T extends keyof IPCUserExtensionEventsMap,
    P extends Parameters<IPCUserExtensionEventsMap[T]>,
  >(
    name: T,
    callback: (
      ...args: [Electron.IpcMainInvokeEvent, ...P]
    ) => ReturnType<IPCUserExtensionEventsMap[T]>,
  ) => {
    handlers[name] = callback;
  };
})();

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
    console.log(appId, appTarget);
    logger(
      'error',
      ['installedApps.launch'],
      `Failed to launch "${path.basename(appTarget || '')}" (${(error as Error).message})`,
    );

    return false;
  }
});
