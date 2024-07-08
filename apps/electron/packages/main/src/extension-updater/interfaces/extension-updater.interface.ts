import { ExtensionManifest } from '@altdot/extension-core';
import { SelectExtension, NewExtension } from '/@/db/schema/extension.schema';

export type ExtensionUpdaterExtension = Pick<
  SelectExtension,
  'id' | 'name' | 'isLocal' | 'updatedAt' | 'path' | 'version'
>;

export type ExtensionUpdaterPayload =
  | {
      extDir: string;
      isError: true;
      extensionId: string;
      extension?: Omit<Partial<NewExtension>, 'id'>;
    }
  | {
      extDir: string;
      isError?: false;
      extensionId: string;
      manifest: ExtensionManifest;
    };
