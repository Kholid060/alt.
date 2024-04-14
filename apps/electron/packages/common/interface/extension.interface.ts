import type { CommandLaunchContext } from '@repo/extension';
import type {
  ExtensionCommand,
  EXTENSION_PERMISSIONS,
  ExtensionConfig,
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
  config?: ExtensionConfig[];
  commands: ExtensionCommand[];
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

export type ExtensionLoaderManifestData =
  | {
      id: string;
      isError: true;
      path: string;
      errorMessage: string;
      $key: string;
    }
  | {
      id: string;
      isError: false;
      manifest: ExtensionManifest;
      path: string;
      $key: string;
    };
