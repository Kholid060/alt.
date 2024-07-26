import type { ExtensionAPI } from '@altdot/extension';
import type { NestedKeyOf } from '../interface/utils.interface';
import type { IPCUserExtensionCustomEventsMap } from '../interface/ipc-events.interface';
import { EXTENSION_PERMISSIONS } from '@altdot/shared';

export type ExtensionAPIPaths =
  | NestedKeyOf<Omit<typeof ExtensionAPI, 'manifest'>>
  | NestedKeyOf<IPCUserExtensionCustomEventsMap>;

type ExtensionPermission = (typeof EXTENSION_PERMISSIONS)[number];

export const API_PERMISSION_MAP: [
  ExtensionAPIPaths,
  Partial<ExtensionPermission>[],
][] = [
  ['oAuth', []],
  ['fs', ['fs']],
  ['runtime', []],
  ['mainWindow', []],
  ['shell', ['shell']],
  ['sqlite', ['sqlite']],
  ['storage', ['storage']],
  ['clipboard', ['clipboard']],
  ['notifications', ['notifications']],
  ['fs.exists', ['fs', 'fs.read']],
  ['fs.readFile', ['fs', 'fs.read']],
  ['fs.readJSON', ['fs', 'fs.read']],
  ['fs.writeFile', ['fs', 'fs.write']],
  ['fs.appendFile', ['fs', 'fs.write']],
  ['browser.tabs', ['browser', 'browser.tabs']],
  ['browser.tabs.#actions', ['browser', 'browser.tabs']],
];
// SORT BY ITS DEEP
API_PERMISSION_MAP.sort(
  (a, z) => a[0].split('.').length - z[0].split('.').length,
);

export function isExtHasApiPermission(
  apiPath: ExtensionAPIPaths,
  permissions: Partial<ExtensionPermission>[],
) {
  const apiPermission = API_PERMISSION_MAP.findLast(([path]) =>
    apiPath.startsWith(path),
  );
  if (!apiPermission) throw new Error(`"${apiPath}" doesn't have permission`);

  if (apiPermission[1].length === 0) return true;

  return permissions.some((permission) =>
    apiPermission[1].includes(permission),
  );
}
