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

export interface DatabaseUpdateExtensionPayload {
  isDisabled?: boolean;
}

export interface DatabaseQueriesEvent {
  'database:update-extension': (
    extensionId: string,
    data: Partial<DatabaseUpdateExtensionPayload>,
  ) => void;
  'database:get-extension-list': () => DatabaseExtension[];
  'database:get-extension': (extensionId: string) => DatabaseExtension | null;
  'database:get-extension-manifest': (
    extensionId: string,
  ) => (ExtensionLoaderManifestData & { $key: string }) | null;
}
