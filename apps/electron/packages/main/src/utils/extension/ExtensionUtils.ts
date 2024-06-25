import fs from 'fs-extra';
import type { ExtensionManifest } from '@alt-dot/extension-core';
import { ExtensionManifestSchema } from '@alt-dot/extension-core';
import path from 'path';
import { fromZodError } from 'zod-validation-error';
import validateSemver from 'semver/functions/valid';
import { loggerBuilder } from '/@/lib/log';
import { parseJSON } from '@alt-dot/shared';

const validatorLogger = loggerBuilder(['ExtensionLoader', 'manifestValidator']);

type ExtractedData<T> =
  | { isError: true; message: string }
  | { isError: false; data: T };

class ExtensionUtils {
  static async extractManifestFromPath(manifestPath: string) {
    const extDir = path.dirname(manifestPath);
    const extDirname = extDir.split('/').pop()!;
    const manifestStr = await fs.readFile(manifestPath, 'utf-8');

    return this.extractManifest(manifestStr, extDirname);
  }

  static async extractManifest(
    manifestStr: string,
    name?: string,
  ): Promise<ExtractedData<ExtensionManifest>> {
    const manifestJSON = await parseJSON(manifestStr, null);
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
    if (!manifest.success) {
      validatorLogger(
        'error',
        `${name}: ${JSON.stringify(manifest.error.format())}`,
      );
      return {
        isError: true,
        message: fromZodError(manifest.error, { prefix: 'Manifest Error' })
          .message,
      };
    }

    if (!validateSemver(manifest.data.version)) {
      const errorMessage = `"${manifest.data.version}" is invalid version`;
      validatorLogger('error', `${name}: ${errorMessage}`);

      return {
        isError: true,
        message: `Manifest Error: ${errorMessage}`,
      };
    }

    return {
      isError: false,
      data: manifest.data,
    };
  }
}

export default ExtensionUtils;
