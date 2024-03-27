import type { EXTENSION_PERMISSIONS } from '@repo/extension-core';
import type ExtensionAPI from '@repo/extension-core/types/extension-api';
import type { NestedKeyOf } from '../interface/utils.interface';

export type ExtensionAPIPaths = NestedKeyOf<
  Omit<typeof ExtensionAPI, 'manifest'>
>;

type ExtensionPermission = (typeof EXTENSION_PERMISSIONS)[number];

export const API_PERMISSION_MAP: [
  ExtensionAPIPaths,
  Partial<ExtensionPermission>[],
][] = [
  ['fs', ['fs']],
  ['runtime', []],
  ['shell', ['shell']],
  ['sqlite', ['sqlite']],
  ['storage', ['storage']],
  ['clipboard', ['clipboard']],
  ['fs.exists', ['fs', 'fs.read']],
  ['fs.readFile', ['fs', 'fs.read']],
  ['fs.readJSON', ['fs', 'fs.read']],
  ['fs.writeFile', ['fs', 'fs.write']],
  ['fs.appendFile', ['fs', 'fs.write']],
  ['browser.activeTab', ['browser.activeTab']],
];
// SORT BY ITS DEEP
API_PERMISSION_MAP.sort(
  (a, z) => a[0].split('.').length - z[0].split('.').length,
);

export function isExtHasApiPermission(
  apiPath: ExtensionAPIPaths,
  permissions: Partial<ExtensionPermission>[],
) {
  const apiPermission = API_PERMISSION_MAP.find(([path]) =>
    apiPath.startsWith(path),
  );
  if (!apiPermission) throw new Error(`"${apiPath}" doesn't have permission`);

  if (apiPermission[1].length === 0) return true;

  return permissions.some((permission) =>
    apiPermission[1].includes(permission),
  );
}
