import type { CommandLaunchContext } from '@repo/extension';
import type { EXTENSION_PERMISSIONS } from '@repo/extension-core';

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
  commandId: string;
  extensionId: string;
  launchContext: CommandLaunchContext;
}
