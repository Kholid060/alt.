import { ExtensionData } from './extension';
import { ObjectWithPrefix } from './utils';

export type IPCUserExtensionEventsMap = ObjectWithPrefix<typeof _extension.installedApps, 'installedApps'>;

export interface IPCEvents {
  'extension:list': () => ExtensionData[];
  'extension:init-message-port': () => MessagePort;
  'apps:get-list': () => _Extension.InstalledAppDetail[];
  'extension:get': (extensionId: string) => ExtensionData & { $key: string } | null;
  'user-extension': <
    T extends keyof IPCUserExtensionEventsMap,
  >(detail: { key: string, name: T, args: Parameters<IPCUserExtensionEventsMap[T]> }) => ReturnType<Awaited<IPCUserExtensionEventsMap[T]>>;
}
