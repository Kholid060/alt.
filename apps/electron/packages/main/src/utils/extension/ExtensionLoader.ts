import path from 'path';
import fs from 'fs-extra';
import { nanoid } from 'nanoid';
import type { ExtensionManifest } from '@repo/extension-core';
import { ExtensionManifestSchema } from '@repo/extension-core';
import validateSemver from 'semver/functions/valid';
import { ErrorLogger, logger, loggerBuilder } from '/@/lib/log';
import { EXTENSION_FOLDER } from '../constant';
import type {
  ExtensionData,
  ExtensionDataBase,
} from '#common/interface/extension.interface';
import {
  ExtensionError,
  ValidationError,
} from '#packages/common/errors/custom-errors';
import extensionsDB from '/@/db/extension.db';
import { fromZodError } from 'zod-validation-error';
import { extensions } from '/@/db/schema/extension.schema';

const validatorLogger = loggerBuilder(['ExtensionLoader', 'manifestValidator']);

async function extractExtManifest(
  manifestPath: string,
): Promise<ExtensionManifest | { isError: true; message: string }> {
  if (!fs.existsSync(manifestPath)) {
    return {
      isError: true,
      message:
        'Could not load the extension manifest. Check if the extension manifest.json file exists.',
    };
  }

  const manifestJSON = await fs.readJSON(manifestPath);
  const manifest = await ExtensionManifestSchema.safeParseAsync(manifestJSON);

  const extDir = path.dirname(manifestPath);
  const extDirname = extDir.split('/').pop()!;

  if (!manifest.success) {
    validatorLogger(
      'error',
      `${extDirname}: ${JSON.stringify(manifest.error.format())}`,
    );
    return {
      isError: true,
      message: fromZodError(manifest.error, { prefix: 'Manifest Error' })
        .message,
    };
  }

  if (!validateSemver(manifest.data.version)) {
    const errorMessage = `"${manifest.data.version}" is invalid version`;
    validatorLogger('error', `${extDirname}: ${errorMessage}`);

    return {
      isError: true,
      message: `Manifest Error: ${errorMessage}`,
    };
  }

  // Check commands file
  const commands = manifest.data.commands.filter((command) => {
    let filename = `${command.name}.js`;
    if (command.type === 'script') {
      filename = command.name;
    }

    return fs.existsSync(path.join(extDir, filename));
  });

  return {
    ...manifest.data,
    commands,
  };
}

async function getExtensionDataManifest(
  extension: ExtensionDataBase & { path: string },
): Promise<ExtensionDataWithPath> {
  const extensionManifest = await extractExtManifest(
    path.join(extension.path, 'manifest.json'),
  );

  if ('isError' in extensionManifest) {
    return {
      ...extension,
      isError: true,
      errorMessage: extensionManifest.message,
    };
  }

  return {
    ...extension,
    isError: false,
    manifest: extensionManifest as ExtensionManifest,
  };
}

type ExtensionDataWithPath = ExtensionData & {
  path: string;
};

class ExtensionLoader {
  static instance = new ExtensionLoader();

  _extensions: Map<string, ExtensionDataWithPath>;

  // for accessing API
  private keys = new Map<string, string>();
  private keysMap = new Map<string, string>();

  constructor() {
    this.keys = new Map();
    this._extensions = new Map();

    this._init();
  }

  @ErrorLogger('ExtensionLoader', 'init')
  private async _init() {
    logger('info', ['ExtensionLoader'], 'INIT EXTENSION');

    await fs.ensureDir(EXTENSION_FOLDER).catch(console.error);
    await this.loadExtensions();
  }

  @ErrorLogger('ExtensionLoader', 'loadExtensions')
  private async loadExtensions() {
    this.keys = new Map();
    this._extensions = new Map();

    const extensionsDbData = await extensionsDB.query.extensions.findMany({
      columns: {
        id: true,
        name: true,
        path: true,
        title: true,
        version: true,
        isLocal: true,
        description: true,
      },
    });
    await Promise.all(
      extensionsDbData.map(async (extension) => {
        const extensionData = await getExtensionDataManifest(extension);
        this.addExtension(extensionData);
      }),
    );
  }

  get extensions(): ExtensionData[] {
    return [...this._extensions.values()];
  }

  getPath(
    extensionId: string,
    type: 'base' | 'icon' | 'libs',
    ...paths: string[]
  ) {
    const extension = this._extensions.get(extensionId);
    if (!extension) return null;

    let basePath = '';

    switch (type) {
      case 'base':
        basePath = extension.path;
        break;
      case 'icon':
        basePath = `${extension.path}/icon`;
        break;
      case 'libs':
        basePath = `${extension.path}/@libs`;
        break;
    }

    return basePath + `${paths.length === 0 ? '' : `/${paths.join('/')}`}`;
  }

  async importExtension(manifestPath: string): Promise<ExtensionData | null> {
    const normalizeManifestPath = path.normalize(manifestPath);

    let isAlreadyAdded = false;
    this._extensions.forEach((extension) => {
      if (
        isAlreadyAdded ||
        path.normalize(extension.path) !== normalizeManifestPath
      )
        return;

      isAlreadyAdded = true;
    });

    if (isAlreadyAdded) return null;

    const manifest = await extractExtManifest(manifestPath);
    if ('isError' in manifest) {
      throw new ValidationError(manifest.message);
    }

    const id = nanoid();
    const { description, name, title, version } = manifest;
    const extensionData: ExtensionDataWithPath = {
      id,
      name,
      title,
      version,
      manifest,
      description,
      isLocal: true,
      isError: false,
      path: path.dirname(manifestPath),
    };

    await extensionsDB.insert(extensions).values(extensionData);
    this.addExtension(extensionData);

    const { path: _, ...extension } = extensionData;

    return extension;
  }

  async reloadExtension(extId: string) {
    const extension = await extensionsDB.query.extensions.findFirst({
      columns: {
        id: true,
        name: true,
        path: true,
        title: true,
        isLocal: true,
        version: true,
        description: true,
      },
      where(fields, operators) {
        return operators.and(
          operators.eq(fields.id, extId),
          operators.eq(fields.isLocal, true),
        );
      },
    });
    if (!extension) throw new ExtensionError("Couldn't find extension");

    const extensionData = await getExtensionDataManifest(extension);
    this._extensions.set(extId, extensionData);

    return extensionData;
  }

  addExtension(extensionData: ExtensionDataWithPath) {
    const extKey = nanoid(5);

    this.keys.set(extKey, extensionData.id);
    this.keysMap.set(extensionData.id, extKey);
    this._extensions.set(extensionData.id, extensionData);
  }

  getExtensionByKey(key: string) {
    const extId = this.keys.get(key);
    if (!extId) return null;

    return this._extensions.get(extId);
  }

  getExtension(extensionId: string) {
    const extension = this._extensions.get(extensionId) ?? null;
    if (!extension) return null;

    return { ...extension, $key: this.keysMap.get(extensionId)! };
  }

  async reloadExtensions() {
    await this.loadExtensions();
    return this._extensions;
  }
}

export default ExtensionLoader;
