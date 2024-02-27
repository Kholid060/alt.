import type { ExtensionManifest } from '@repo/extension-core';

export interface ExtensionData {
  id: string;
  manifest: ExtensionManifest;
}
