import { ExtensionError } from '#packages/common/errors/ExtensionError';
import type { ExtensionData } from '#packages/common/interface/extension.interface';
import { ExtensionManifestSchema } from '@repo/extension-core';
import { dialog } from 'electron';
import fs from 'fs-extra';
import { logger } from '/@/lib/log';
import { store } from '/@/lib/store';
import { nanoid } from 'nanoid/non-secure';
import ExtensionLoader from './ExtensionLoader';
import { EXTENSION_LOCAL_ID_PREFIX } from '../constant';
import path from 'path';

export async function extensionImport(): Promise<ExtensionData | null> {
  try {
    const {
      canceled,
      filePaths: [manifestPath],
    } = await dialog.showOpenDialog({
      buttonLabel: 'Import',
      properties: ['openFile'],
      title: 'Import Extension',
      filters: [{ extensions: ['json'], name: 'Extension manifest' }],
    });
    if (canceled || !manifestPath) return null;

    const localExtensions = store.get('localExtensions', {});
    const isAlreadyAdded = Object.values(localExtensions).some(
      (ext) => ext.path === path.dirname(manifestPath),
    );
    if (isAlreadyAdded) return null;

    const manifestJSON = await fs.readJSON(manifestPath);

    const extensionManifest =
      await ExtensionManifestSchema.safeParseAsync(manifestJSON);
    if (!extensionManifest.success) {
      throw new ExtensionError('Invalid extension manifest');
    }

    const extensionId = `${EXTENSION_LOCAL_ID_PREFIX}${nanoid()}`;

    localExtensions[extensionId] = {
      id: extensionId,
      path: path.dirname(manifestPath),
    };
    store.set('localExtensions', localExtensions);

    const extensionData: ExtensionData = {
      isLocal: true,
      id: extensionId,
      manifest: extensionManifest.data,
    };
    ExtensionLoader.instance.addExtension(extensionData);

    return extensionData;
  } catch (error) {
    if (error instanceof Error) {
      logger('error', ['extensionImport'], error.message);
    }

    throw error;
  }
}
