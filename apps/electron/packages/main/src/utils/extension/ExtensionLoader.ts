import path from 'path';
import fs from 'fs-extra';
import { nanoid } from 'nanoid/non-secure';
import { ExtensionManifestSchema } from '@repo/command-api';
import { globby } from 'globby';
import validateSemver from 'semver/functions/valid';
import { ErrorLogger, logger, loggerBuilder } from '/@/lib/log';
import { EXTENSION_FOLDER } from '../constant';
import type { ExtensionData } from '#common/interface/extension';

const validatorLogger = loggerBuilder(['ExtensionLoader', 'manifestValidator']);

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
  const commands = manifest.data.commands.filter((command) =>
    fs.existsSync(path.join(extDir, `${command.name}.js`)),
  );
  if (commands.length === 0) {
    validatorLogger('error', `${extDirname}: commands empty`);
    return null;
  }

  return {
    id: extDirname,
    manifest: manifest.data,
  };
}

class ExtensionLoader {
  static instance = new ExtensionLoader();

  _extensions: Map<string, ExtensionData>;

  // for accessing API
  private keys = new Map<string, string>();
  private keysMap = new Map<string, string>();
  private extFolderPosix = EXTENSION_FOLDER.replaceAll('\\', '/');

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
      path.posix.join(this.extFolderPosix, '**/manifest.json'),
    );
    const extensionsManifest = await Promise.all(
      extensionsManifestPath.map(extractExtManifest),
    );

    for (const extensionData of extensionsManifest) {
      if (!extensionData) continue;

      const extKey = nanoid(5);

      this.keys.set(extKey, extensionData.id);
      this.keysMap.set(extensionData.id, extKey);
      this._extensions.set(extensionData.id, extensionData);
    }
  }

  get extensions(): ExtensionData[] {
    return [...this._extensions.values()];
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
