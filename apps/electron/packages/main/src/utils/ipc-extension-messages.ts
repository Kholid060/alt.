// to-do aaaaaaaaa
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import type { IPCUserExtensionEventsMap } from '#common/interface/ipc-events';
import InstalledApps from './InstalledApps';
import { onIpcMessage } from './ipc-messages-handler';

type ExtEventHandler<P extends keyof IPCUserExtensionEventsMap> =
  IPCUserExtensionEventsMap[P];

const queryInstalledApps: ExtEventHandler<'installedApps.query'> = async (
  query,
) => {
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
};

onIpcMessage('user-extension', async (_, payload) => {
  switch (payload.name) {
    case 'installedApps.launch':
      return true;
    case 'installedApps.query':
      return await queryInstalledApps(...payload.args);
  }
});
