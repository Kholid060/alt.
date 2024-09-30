import originalFs from 'original-fs';
import AdmZip from 'adm-zip';
import fs from 'fs-extra';
import path from 'path';
import { EXTENSION_FOLDER } from '../common/utils/constant';

export async function extractExtensionZIP(zip: Buffer, extensionId: string) {
  const admZip = new AdmZip(zip, { fs: originalFs });

  const manifestFile = admZip.getEntry('manifest.json');
  if (!manifestFile || manifestFile.isDirectory) {
    throw new Error('Manifest file not found');
  }

  const extDir = path.join(EXTENSION_FOLDER, extensionId);
  await fs.emptyDir(extDir);
  await fs.ensureDir(extDir);

  await new Promise<void>((resolve, reject) => {
    admZip.extractAllToAsync(extDir, true, true, (error) => {
      if (error) return reject(error);

      resolve();
    });
  });

  /**
   * Create a dummy package.json file to set the type to module
   * otherwise it will throw "Cannot use import statement outside a module" error
   * when importing the extension command file in the extension worker
   */
  await fs.writeJSON(path.join(extDir, 'package.json'), {
    type: 'module',
    name: 'altdot-extension',
  });

  return extDir;
}
