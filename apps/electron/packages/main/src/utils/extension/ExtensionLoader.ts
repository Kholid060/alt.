import { app } from 'electron';
import path from 'path';
import fs from 'fs-extra';
import { ExtensionManifest, ExtensionManifestSchema } from '@repo/command-api';
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

  extensions: Map<string, ExtensionData>;

  private extFolderPosix = EXTENSION_FOLDER.replaceAll('\\', '/');

  constructor() {
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
    const extensionsManifestPath = await globby(path.posix.join(this.extFolderPosix, '**/manifest.json'));
    const extensionsManifest = await Promise.all(extensionsManifestPath.map(extractExtManifest));

    for (const extensionData of extensionsManifest) {
      if (!extensionData) continue;

      this.extensions.set(extensionData.id, extensionData);
    }
  }

  getExtensions(): ExtensionData[] {
    return [...this.extensions.values()];
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
