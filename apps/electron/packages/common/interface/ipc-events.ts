import type { PublicInstalledAppDetail } from './installed-apps';
import { ExtensionData } from './extension';

export interface IPCEvents {
  'extension:list': () => ExtensionData[];
  'extension:init-message-port': () => MessagePort;
  'extension:get': (extensionId: string) => ExtensionData | null;
  'apps:get-list': () => PublicInstalledAppDetail[];
}
