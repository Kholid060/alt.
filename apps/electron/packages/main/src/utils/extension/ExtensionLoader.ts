import path from 'path';
import fs from 'fs-extra';
import crypto from 'node:crypto';
import type { ExtensionManifest } from '@repo/extension-core';
import { ExtensionManifestSchema } from '@repo/extension-core';
import validateSemver from 'semver/functions/valid';
import gtSemver from 'semver/functions/gt';
import { ErrorLogger, loggerBuilder } from '/@/lib/log';
import { EXTENSION_FOLDER } from '../constant';
import {
  ExtensionError,
  ValidationError,
} from '#packages/common/errors/custom-errors';
import { fromZodError } from 'zod-validation-error';
import type {
  NewExtension,
  NewExtensionCommand,
} from '/@/db/schema/extension.schema';
import { extensions as extensionsSchema } from '/@/db/schema/extension.schema';
import { mapManifestToDB } from '../database-utils';
import type { DatabaseExtension } from '/@/interface/database.interface';
import DBService from '/@/services/database/database.service';
import { EXTENSION_BUILT_IN_ID } from '#packages/common/utils/constant/extension.const';
import { eq } from 'drizzle-orm';

const validatorLogger = loggerBuilder(['ExtensionLoader', 'manifestValidator']);

type ExtractedData<T> =
  | { isError: true; message: string }
  | { isError: false; data: T };

async function readExtensionManifest(
  manifestPath: string,
): Promise<ExtractedData<ExtensionManifest>> {
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

  return {
    isError: false,
    data: manifestJSON,
  };
}
async function extractExtManifest(
  manifestPath: string,
): Promise<ExtractedData<ExtensionManifest>> {
  const manifestJSON = await readExtensionManifest(manifestPath);
  if (manifestJSON.isError) return manifestJSON;

  const manifest = await ExtensionManifestSchema.safeParseAsync(
    manifestJSON.data,
  );

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
    isError: false,
    data: {
      ...manifest.data,
      commands,
    },
  };
}

class ExtensionLoader {
  private static _instance: ExtensionLoader | null = null;

  static get instance() {
    if (!this._instance) {
      this._instance = new ExtensionLoader();
    }

    return this._instance;
  }

  private extensionsManifestPath = new Map<string, string>();

  constructor() {
    fs.ensureDir(EXTENSION_FOLDER).catch(console.error);
  }

  @ErrorLogger('ExtensionLoader', 'loadExtensions')
  async loadExtensions() {
    await DBService.instance.db.transaction(async (tx) => {
      const extensions = await tx.query.extensions.findMany({
        columns: {
          id: true,
          path: true,
          isLocal: true,
          isError: true,
          version: true,
          updatedAt: true,
        },
        where(fields, operators) {
          return operators.notInArray(
            fields.id,
            Object.values(EXTENSION_BUILT_IN_ID),
          );
        },
      });

      await Promise.all(
        extensions.map(async (extension) => {
          this.extensionsManifestPath.set(extension.id, extension.path);

          if (extension.isLocal) {
            const extensionManifestPath = path.join(
              extension.path,
              'manifest.json',
            );
            const extensionManifest = await extractExtManifest(
              extensionManifestPath,
            );

            let updateExtensionPayload: Partial<NewExtension> = {
              isError: extensionManifest.isError,
              errorMessage: extensionManifest.isError
                ? extensionManifest.message
                : null,
            };

            const lastUpdatedDb = new Date(extension.updatedAt);
            const manifestFileStats = await fs.stat(extensionManifestPath);
            if (
              !extensionManifest.isError &&
              (manifestFileStats.mtime > lastUpdatedDb ||
                gtSemver(extensionManifest.data.version, extension.version))
            ) {
              updateExtensionPayload = {
                ...updateExtensionPayload,
                ...mapManifestToDB.extension(extensionManifest.data),
              };

              await DBService.instance.extension.upsertCommands(
                extension.id,
                extensionManifest.data.commands,
                tx,
              );
            }

            await tx
              .update(extensionsSchema)
              .set(updateExtensionPayload)
              .where(eq(extensionsSchema.id, extension.id));

            return;
          }

          // check update from server?
        }),
      );
    });
  }

  isLocal(extPath: string) {
    return !extPath.startsWith(EXTENSION_FOLDER);
  }

  getPath(
    extensionId: string,
    type: 'base' | 'icon' | 'libs',
    ...paths: string[]
  ) {
    const extensionDir = this.extensionsManifestPath.get(extensionId);
    if (!extensionDir) return null;

    let basePath = '';

    switch (type) {
      case 'base':
        basePath = extensionDir;
        break;
      case 'icon':
        basePath = `${extensionDir}/icon`;
        break;
      case 'libs':
        basePath = `${extensionDir}/@libs`;
        break;
    }

    return basePath + `${paths.length === 0 ? '' : `/${paths.join('/')}`}`;
  }

  async importExtension(
    manifestPath: string,
  ): Promise<DatabaseExtension | null> {
    const normalizeManifestPath = path.normalize(path.dirname(manifestPath));

    let isAlreadyAdded = false;
    this.extensionsManifestPath.forEach((manifestPath) => {
      if (isAlreadyAdded) return;
      isAlreadyAdded = manifestPath === normalizeManifestPath;
    });

    if (isAlreadyAdded) return null;

    const manifest = await extractExtManifest(manifestPath);
    if (manifest.isError) {
      throw new ValidationError(manifest.message);
    }

    const id = crypto
      .createHash('sha256')
      .update(normalizeManifestPath)
      .digest('hex');
    const insertCommands: NewExtensionCommand[] = manifest.data.commands.map(
      (command) => ({
        id: `${id}:${command.name}`,
        extensionId: id,
        ...mapManifestToDB.command(command),
      }),
    );
    const extension = await DBService.instance.extension.insert(
      {
        id,
        isLocal: true,
        isDisabled: false,
        path: normalizeManifestPath,
        ...mapManifestToDB.extension(manifest.data),
      },
      insertCommands,
    );
    this.extensionsManifestPath.set(extension.id, extension.path);

    return extension;
  }

  async reloadExtension(extId: string): Promise<boolean> {
    const extension = await DBService.instance.db.query.extensions.findFirst({
      columns: {
        id: true,
        path: true,
        version: true,
        updatedAt: true,
      },
      where(fields, operators) {
        return operators.and(
          operators.eq(fields.id, extId),
          operators.eq(fields.isLocal, true),
        );
      },
    });
    if (!extension) throw new ExtensionError("Couldn't find extension");

    const manifestFilePath = path.join(extension.path, 'manifest.json');
    const extensionManifest = await extractExtManifest(manifestFilePath);

    let updateExtensionPayload: Partial<NewExtension> = {
      isError: extensionManifest.isError,
      errorMessage: extensionManifest.isError
        ? extensionManifest.message
        : null,
    };

    const lastUpdatedDb = new Date(extension.updatedAt);
    const manifestFileStats = fs.statSync(manifestFilePath);
    if (
      !extensionManifest.isError &&
      (manifestFileStats.mtime > lastUpdatedDb ||
        gtSemver(extensionManifest.data.version, extension.version))
    ) {
      updateExtensionPayload = {
        ...updateExtensionPayload,
        ...mapManifestToDB.extension(extensionManifest.data),
      };

      await DBService.instance.extension.upsertCommands(
        extension.id,
        extensionManifest.data.commands,
      );
      this.extensionsManifestPath.set(extension.id, extension.path);
    }

    await DBService.instance.db
      .update(extensionsSchema)
      .set(updateExtensionPayload);

    return true;
  }
}

export default ExtensionLoader;
