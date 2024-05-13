import type { CommandLaunchContext } from '@repo/extension';
import type { EXTENSION_PERMISSIONS } from '@repo/extension-core';
import type { DatabaseExtensionCommandWithExtension } from '../../main/src/interface/database.interface';
import type { BrowserExtensionTab } from '@repo/shared';

export type ExtensionPermissions = (typeof EXTENSION_PERMISSIONS)[number];

export interface ExtensionCommandViewInitMessage {
  type: 'init';
  themeStyle: string;
  launchContext: CommandLaunchContext;
}

export interface ExtensionConfigData {
  id: number;
  configId: string;
  extensionId: string;
  value: Record<string, unknown>;
}

export interface ExtensionCommandExecutePayload {
  timeoutMs?: number;
  commandId: string;
  extensionId: string;
  launchContext: CommandLaunchContext;
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

export type ExtensionCommandConfigValuePayload =
  | { requireInput: false }
  | {
      requireInput: true;
      type: 'extension' | 'command';
    };

export type ExtensionBrowserTabContext =
  | (BrowserExtensionTab & { browserId: string })
  | null;

export interface ExtensionAPIMessagePayload {
  key: string;
  name: string;
  args: unknown[];
  commandId: string;
  browserCtx: ExtensionBrowserTabContext;
  sender: Electron.IpcMainInvokeEvent | null;
}
