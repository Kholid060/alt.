import path from 'path';
import fs from 'fs-extra';
import { nanoid } from 'nanoid';
import type { ExtensionCommand, ExtensionManifest } from '@repo/extension-core';
import { ExtensionManifestSchema } from '@repo/extension-core';
import validateSemver from 'semver/functions/valid';
import { ErrorLogger, logger, loggerBuilder } from '/@/lib/log';
import { EXTENSION_FOLDER } from '../constant';
import type {
  ExtensionData,
  ExtensionDataBase,
  ExtensionLoaderManifestData,
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

  const manifestJSON = await fs.readJSON(manifestPath, { throws: false });
  if (!manifestJSON) {
    const errorMessage =
      "Couldn't parse the extension manifest file.\nPlease check the manifest file format. It needs to be a valid JSON";
    validatorLogger('error', errorMessage);

    return {
      isError: true,
      message: errorMessage,
    };
  }

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
): Promise<ExtensionLoaderManifestData> {
  const extensionManifest = await extractExtManifest(
    path.join(extension.path, 'manifest.json'),
  );

  if ('isError' in extensionManifest) {
    return {
      ...extension,
      $key: '',
      isError: true,
      errorMessage: extensionManifest.message,
    };
  }

  return {
    ...extension,
    $key: '',
    isError: false,
    manifest: extensionManifest as ExtensionManifest,
  };
}

class ExtensionLoader {
  static instance = new ExtensionLoader();

  private extensionsManifest: Map<string, ExtensionLoaderManifestData> =
    new Map();

  // for accessing API
  private keys = new Map<string, string>();
  private keysMap = new Map<string, string>();

  constructor() {
    this.keys = new Map();
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
    this.extensionsManifest = new Map();

    const extensionsDbData = await extensionsDB.query.extensions.findMany({
      columns: {
        id: true,
        name: true,
        icon: true,
        path: true,
        title: true,
        version: true,
        isLocal: true,
        isDisabled: true,
        description: true,
      },
    });
    await Promise.all(
      extensionsDbData.map(async (extension) => {
        const extensionData = await getExtensionDataManifest(extension);
        this.addExtensionManifest(extensionData);
      }),
    );
  }

  isLocal(extPath: string) {
    return extPath.startsWith(EXTENSION_FOLDER);
  }

  getCommand(extensionId: string, commandId: string): ExtensionCommand | null {
    const extension = this.getManifest(extensionId);
    if (!extension || extension.isError) return null;

    const command =
      extension.manifest.commands.find(
        (command) => command.name === commandId,
      ) ?? null;

    return command;
  }

  getPath(
    extensionId: string,
    type: 'base' | 'icon' | 'libs',
    ...paths: string[]
  ) {
    const extension = this.extensionsManifest.get(extensionId);
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

  @ErrorLogger('ExtensionLoader', 'importExtension')
  async importExtension(manifestPath: string): Promise<ExtensionData | null> {
    const normalizeManifestPath = path.normalize(path.dirname(manifestPath));

    let isAlreadyAdded = false;
    this.extensionsManifest.forEach((manifest) => {
      if (
        isAlreadyAdded ||
        path.normalize(manifest.path) !== normalizeManifestPath
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
    const extensionData: ExtensionLoaderManifestData = {
      id,
      manifest,
      $key: '',
      isError: false,
      path: normalizeManifestPath,
    };

    await extensionsDB.insert(extensions).values({
      id,
      name,
      title,
      version,
      description,
      isLocal: true,
      isDisabled: false,
      icon: manifest.icon,
      path: normalizeManifestPath,
    });
    this.addExtensionManifest(extensionData);

    return {
      id,
      name,
      title,
      version,
      description,
      isLocal: true,
      isError: false,
      isDisabled: false,
      icon: manifest.icon,
      commands: manifest.commands,
      path: normalizeManifestPath,
    };
  }

  async reloadExtension(extId: string) {
    const extension = await extensionsDB.query.extensions.findFirst({
      columns: {
        id: true,
        icon: true,
        name: true,
        path: true,
        title: true,
        isLocal: true,
        version: true,
        isDisabled: true,
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
    this.extensionsManifest.set(extId, extensionData);

    return extensionData;
  }

  addExtensionManifest(manifestData: ExtensionLoaderManifestData) {
    const extKey = nanoid(5);

    this.keys.set(extKey, manifestData.id);
    this.keysMap.set(manifestData.id, extKey);
    this.extensionsManifest.set(manifestData.id, {
      ...manifestData,
      $key: extKey,
    });
  }

  getManifestByKey(key: string) {
    const extId = this.keys.get(key);
    if (!extId) return null;

    return this.extensionsManifest.get(extId);
  }

  getManifest(
    extensionId: string,
  ): (ExtensionLoaderManifestData & { $key: string }) | null {
    const manifest = this.extensionsManifest.get(extensionId) ?? null;
    if (!manifest) return null;

    return { ...manifest, $key: this.keysMap.get(extensionId)! };
  }
}

export default ExtensionLoader;
