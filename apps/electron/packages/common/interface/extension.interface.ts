import type { CommandLaunchContext } from '@repo/extension';
import type { EXTENSION_PERMISSIONS } from '@repo/extension-core';
import type { DatabaseExtensionCommandWithExtension } from '../../main/src/interface/database.interface';

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

export interface ExtensionJSONViewData extends ExtensionCommandExecutePayload {
  title: string;
  icon: string;
  subtitle: string;
  processId: string;
}

export interface ExtensionCommandExecutePayloadWithData
  extends ExtensionCommandExecutePayload {
  command: DatabaseExtensionCommandWithExtension;
}

export type ExtensionCommandConfigValuePayload =
  | { requireInput: false }
  | {
      requireInput: true;
      type: 'extension' | 'command';
    };
