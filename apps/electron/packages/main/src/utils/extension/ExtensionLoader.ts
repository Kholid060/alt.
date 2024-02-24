import path from 'path';
import fs from 'fs-extra';
import { nanoid } from 'nanoid/non-secure';
import { ExtensionManifestSchema } from '@repo/command-api';
import { globby } from 'globby';
import validateSemver from 'semver/functions/valid';
import { ErrorLogger, logger, loggerBuilder } from '/@/lib/log';
import { EXTENSION_FOLDER } from '../constant';
import { ExtensionData } from '#common/interface/extension';


const validatorLogger = loggerBuilder(['ExtensionLoader', 'manifestValidator']);

async function extractExtManifest(manifestPath: string) {
  const manifestJSON = await fs.readJSON(manifestPath);
  const manifest = await ExtensionManifestSchema.safeParseAsync(manifestJSON);

  const extDir = path.dirname(manifestPath);
  const extDirname = extDir.split('/').pop()!;

  if (!manifest.success) {
    validatorLogger('error', `${extDirname}: ${JSON.stringify(manifest.error.format())}`)
    return null;
  }

  if (!validateSemver(manifest.data.version)) {
    validatorLogger('error', `${extDirname}: "${manifest.data.version}" is invalid version`);
    return null;
  }

  // Check commands file
  const commands = manifest.data.commands.filter((command) =>
    fs.existsSync(path.join(extDir, `${command.name}.js`))
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

  extensions: Map<string, ExtensionData & { $key: string }>;

  // for accessing API
  private keys = new Map<string, string>();
  private extFolderPosix = EXTENSION_FOLDER.replaceAll('\\', '/');

  constructor() {
    this.keys = new Map();
    this.extensions = new Map();

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
    this.extensions = new Map();

    const extensionsManifestPath = await globby(path.posix.join(this.extFolderPosix, '**/manifest.json'));
    const extensionsManifest = await Promise.all(extensionsManifestPath.map(extractExtManifest));

    for (const extensionData of extensionsManifest) {
      if (!extensionData) continue;

      const extKey = nanoid(5);

      this.keys.set(extKey, extensionData.id);
      this.extensions.set(extensionData.id, { ...extensionData, $key: extKey });
    }
  }

  getExtensions(): ExtensionData[] {
    return [...this.extensions.values()].map((extension) => {
      // @ts-ignore
      delete extension.$key;

      return extension;
    });
  }

  getExtensionByKey(key: string) {
    const extId = this.keys.get(key);
    if (!extId) return null;

    return this.extensions.get(extId);
  }

  getExtension(extensionId: string) {
    return this.extensions.get(extensionId) ?? null;
  }

  async reloadExtensions() {
    await this.loadExtensions();
    return this.extensions;
  }
}

export default ExtensionLoader;
