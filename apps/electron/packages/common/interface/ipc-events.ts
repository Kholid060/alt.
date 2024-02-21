import type { ExtensionManifest } from '@repo/command-api';
import type { PublicInstalledAppDetail } from './installed-apps';

export interface IPCEvents {
  'extension:list': () => ExtensionManifest[];
  'apps:get-list': () => PublicInstalledAppDetail[];
}
