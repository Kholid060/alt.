import type { ExtensionManifest } from '@repo/extension-core';
import type {
  ExtensionDataError,
  ExtensionDataValid,
  ExtensionLoaderManifestData,
} from './extension.interface';

export type DatabaseExtension =
  | ExtensionDataError
  | (Omit<ExtensionDataValid, 'manifest'> &
      Pick<ExtensionManifest, 'commands' | 'config'> & {
        $key: string;
      });

export interface DatabaseQueriesEvent {
  'database:get-extension-list': () => DatabaseExtension[];
  'database:get-extension': (extensionId: string) => DatabaseExtension | null;
  'database:get-extension-manifest': (
    extensionId: string,
  ) => (ExtensionLoaderManifestData & { $key: string }) | null;
}
