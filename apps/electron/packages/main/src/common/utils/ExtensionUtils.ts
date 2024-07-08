import fs from 'fs-extra';
import type { ExtensionManifest } from '@altdot/extension-core';
import { ExtensionManifestSchema } from '@altdot/extension-core';
import { fromZodError } from 'zod-validation-error';
import validateSemver from 'semver/functions/valid';
import { parseJSON } from '@altdot/shared';

type ExtractedData<T> =
  | { isError: true; message: string }
  | { isError: false; data: T };

class ExtensionUtils {
  static async extractManifestFromPath(
    manifestPath: string,
  ): Promise<ExtractedData<ExtensionManifest>> {
    if (!fs.existsSync(manifestPath)) {
      return {
        isError: true,
        message: 'Manifest file not found',
      };
    }

    return this.extractManifest(await fs.readFile(manifestPath, 'utf-8'));
  }

  static async extractManifest(
    manifestStr: string,
  ): Promise<ExtractedData<ExtensionManifest>> {
    const manifestJSON = await parseJSON(manifestStr, null);
    if (!manifestJSON) {
      const errorMessage =
        "Couldn't parse the extension manifest file.\nPlease check the manifest file format. It needs to be a valid JSON";

      return {
        isError: true,
        message: errorMessage,
      };
    }

    const manifest = await ExtensionManifestSchema.safeParseAsync(manifestJSON);
    if (!manifest.success) {
      return {
        isError: true,
        message: fromZodError(manifest.error, { prefix: 'Manifest Error' })
          .message,
      };
    }

    if (!validateSemver(manifest.data.version)) {
      return {
        isError: true,
        message: `Manifest Error: "${manifest.data.version}" is invalid version`,
      };
    }

    return {
      isError: false,
      data: manifest.data,
    };
  }
}

export default ExtensionUtils;
