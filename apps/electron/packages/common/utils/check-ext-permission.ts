import type { EXTENSION_PERMISSIONS } from '@repo/extension-api';
import type ExtensionAPI from '@repo/extension-api/types/extension-api';
import type { NestedKeyOf } from '../interface/utils';

export type ExtensionAPIPaths = NestedKeyOf<
  Omit<typeof ExtensionAPI, 'manifest'>
>;

type ExtensionPermission = (typeof EXTENSION_PERMISSIONS)[number];

// SORT BY ITS DEEP
export const API_PERMISSION_MAP: [
  ExtensionAPIPaths,
  Partial<ExtensionPermission>[],
][] = [
  ['installedApps', ['installed-apps']],
  ['installedApps.query', ['installed-apps']],
];
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

  return permissions.some((permission) =>
    apiPermission[1].includes(permission),
  );
}
