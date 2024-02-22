import type { PublicInstalledAppDetail } from './installed-apps';
import { ExtensionData } from './extension';

export interface IPCEvents {
  'extension:list': () => ExtensionData[];
  'apps:get-list': () => PublicInstalledAppDetail[];
}
