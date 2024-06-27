import type { CommandLaunchContext } from '@alt-dot/extension';
import type {
  EXTENSION_CONFIG_TYPE,
  EXTENSION_PERMISSIONS,
} from '@alt-dot/extension-core';
import type { DatabaseExtensionCommandWithExtension } from '../../main/src/interface/database.interface';

export type ExtensionConfigType = (typeof EXTENSION_CONFIG_TYPE)[number];
export type ExtensionPermissions = (typeof EXTENSION_PERMISSIONS)[number];

export interface ExtensionCommandViewInitMessage {
  type: 'init';
  themeStyle: string;
  payload: ExtensionCommandExecutePayload;
}

export interface ExtensionConfigData {
  id: number;
  configId: string;
  extensionId: string;
  value: Record<string, unknown>;
}

export interface ExtensionCommandExecutePayload {
  commandId: string;
  timeoutMs?: number;
  extensionId: string;
  launchContext: CommandLaunchContext;
  browserCtx?: ExtensionBrowserTabContext;
}

export interface ExtensionCommandViewData
  extends ExtensionCommandExecutePayload {
  title: string;
  icon: string;
  subtitle: string;
}

export interface ExtensionCommandJSONViewData extends ExtensionCommandViewData {
  runnerId: string;
}

export interface ExtensionCommandExecutePayloadWithData
  extends ExtensionCommandExecutePayload {
  commandFilePath: string;
  command: DatabaseExtensionCommandWithExtension;
}

export type ExtensionNeedConfigInput = 'extension' | 'command' | false;

export type ExtensionBrowserTabContext = {
  url: string;
  title: string;
  tabId: number;
  browserId: string;
} | null;

export interface ExtensionAPIMessagePayload {
  key: string;
  name: string;
  args: unknown[];
  commandId: string;
  browserCtx: ExtensionBrowserTabContext;
  sender: Electron.IpcMainInvokeEvent | null;
}

export interface ExtensionCommandProcess {
  icon: string;
  title: string;
  runnerId: string;
  extensionId: string;
  extensionTitle: string;
}
