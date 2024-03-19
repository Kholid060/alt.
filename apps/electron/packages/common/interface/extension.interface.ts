import type { CommandLaunchContext } from '@repo/extension';
import type {
  EXTENSION_PERMISSIONS,
  ExtensionManifest,
} from '@repo/extension-core';

export interface ExtensionData {
  id: string;
  isLocal?: boolean;
  manifest: ExtensionManifest;
}

export type ExtensionPermissions = (typeof EXTENSION_PERMISSIONS)[number];

export interface ExtensionCommandViewInitMessage {
  type: 'init';
  themeStyle: string;
  launchContext: CommandLaunchContext;
}
