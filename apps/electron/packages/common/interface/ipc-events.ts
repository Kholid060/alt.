import type { ExtensionManifest } from '@repo/command-api';

export interface IPCEvents {
  'extension:list': () => ExtensionManifest[];
}
