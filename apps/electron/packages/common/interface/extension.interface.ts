import type { CommandLaunchContext } from '@repo/extension';
import type {
  EXTENSION_PERMISSIONS,
  ExtensionManifest,
} from '@repo/extension-core';

export interface ExtensionDataBase {
  id: string;
  name: string;
  icon: string;
  title: string;
  path?: string;
  version: string;
  isLocal?: boolean;
  isDisabled: boolean;
  description: string;
}

export interface ExtensionDataValid extends ExtensionDataBase {
  isError: false;
  manifest: ExtensionManifest;
}

export interface ExtensionDataError extends ExtensionDataBase {
  isError: true;
  errorMessage?: string;
}

export type ExtensionData = ExtensionDataValid | ExtensionDataError;

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
