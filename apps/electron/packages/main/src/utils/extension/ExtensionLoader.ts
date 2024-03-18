import path from 'path';
import fs from 'fs-extra';
import { nanoid } from 'nanoid/non-secure';
import { ExtensionManifestSchema } from '@repo/extension-core';
import { globby } from 'globby';
import validateSemver from 'semver/functions/valid';
import { ErrorLogger, logger, loggerBuilder } from '/@/lib/log';
import { EXTENSION_FOLDER, EXTENSION_LOCAL_ID_PREFIX } from '../constant';
import type { ExtensionData } from '#common/interface/extension.interface';
import { store } from '/@/lib/store';
import { ExtensionError } from '#packages/common/errors/ExtensionError';

const validatorLogger = loggerBuilder(['ExtensionLoader', 'manifestValidator']);

const EXTENSION_DIR_POSIX = EXTENSION_FOLDER.replaceAll('\\', '/');

async function extractExtManifest(manifestPath: string) {
  const manifestJSON = await fs.readJSON(manifestPath);
  const manifest = await ExtensionManifestSchema.safeParseAsync(manifestJSON);

  const extDir = path.dirname(manifestPath);
  const extDirname = extDir.split('/').pop()!;

  if (!manifest.success) {
    validatorLogger(
      'error',
      `${extDirname}: ${JSON.stringify(manifest.error.format())}`,
    );
    return null;
  }

  if (!validateSemver(manifest.data.version)) {
    validatorLogger(
      'error',
      `${extDirname}: "${manifest.data.version}" is invalid version`,
    );
    return null;
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
    id: extDirname,
    manifest: {
      ...manifest.data,
      commands,
    },
  };
}

export function getExtensionFolder(extensionId: string) {
  let extensionFolderDir = `${EXTENSION_FOLDER}/${extensionId}/icon`;
  if (extensionId.startsWith(EXTENSION_LOCAL_ID_PREFIX)) {
    extensionFolderDir = store.get(`localExtensions.${extensionId}.path`, '');
  }

  return extensionFolderDir;
}

class ExtensionLoader {
  static instance = new ExtensionLoader();

  _extensions: Map<string, ExtensionData>;

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

    const extensionsManifestPath = await globby(
      path.posix.join(EXTENSION_DIR_POSIX, '**/manifest.json'),
    );

    const extensionsManifest = await Promise.all(
      extensionsManifestPath.map(extractExtManifest),
    );

    await Promise.all(
      Object.values(store.get('localExtensions', {})).map(async (localExt) => {
        const extData = await extractExtManifest(
          path.posix.join(localExt.path, 'manifest.json'),
        );
        if (!extData) return;

        extensionsManifest.push({
          isLocal: true,
          id: localExt.id,
          manifest: extData.manifest,
        } as ExtensionData);
      }),
    );

    for (const extensionData of extensionsManifest) {
      if (!extensionData) continue;

      this.addExtension(extensionData);
    }
  }

  get extensions(): ExtensionData[] {
    return [...this._extensions.values()];
  }

  async reloadExtension(extId: string) {
    const extPath = store.get<string, string>(
      `localExtensions.${extId}.path`,
      '',
    );
    if (!extPath) throw new ExtensionError("Can't find extension");

    const extData = await extractExtManifest(
      path.posix.join(extPath, 'manifest.json'),
    );
    if (!extData) return null;

    const extensionData: ExtensionData = {
      id: extId,
      isLocal: true,
      manifest: extData.manifest,
    };

    this._extensions.set(extId, extensionData);

    return extensionData;
  }

  addExtension(extensionData: ExtensionData) {
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
