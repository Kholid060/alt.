import path from 'path';
import fs from 'fs-extra';
import crypto from 'node:crypto';
import type { ExtensionManifest } from '@alt-dot/extension-core';
import { ExtensionManifestSchema } from '@alt-dot/extension-core';
import validateSemver from 'semver/functions/valid';
import gtSemver from 'semver/functions/gt';
import { ErrorLogger, logger, loggerBuilder } from '/@/lib/log';
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
import API from '#packages/common/utils/API';
import { afetch } from '@alt-dot/shared';
import originalFs from 'original-fs';
import GlobalShortcut from '../GlobalShortcuts';
import AdmZip from 'adm-zip';

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

              const ids: string[] = [];
              await DBService.instance.extension.upsertCommands(
                extensionManifest.data.commands.map((command) => {
                  const id = `${extension.id}:${command.name}`;

                  return {
                    id,
                    extensionId: extension.id,
                    ...mapManifestToDB.command(command),
                  };
                }),
                tx,
              );
              await DBService.instance.extension.deleteNotExistsCommand(
                ids,
                tx,
              );

              await DBService.instance.extension.deleteNotExistsCreds(
                extension.id,
                extensionManifest.data.credentials || [],
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
    {
      extensionId,
      isLocal = true,
    }: { extensionId?: string; isLocal?: boolean } = {},
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

    const id =
      extensionId ||
      crypto
        .createHash('sha256')
        .update(normalizeManifestPath)
        .digest('hex')
        .slice(0, 24);
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
        isLocal,
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
        isLocal: true,
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
    if (!extension.isLocal) return false;

    const manifestFilePath = path.join(extension.path, 'manifest.json');
    const extensionManifest = await extractExtManifest(manifestFilePath);

    let updateExtensionPayload: Partial<NewExtension> = {
      updatedAt: new Date().toISOString(),
      isError: extensionManifest.isError,
      errorMessage: extensionManifest.isError
        ? extensionManifest.message
        : null,
    };

    const manifestFileStats = fs.statSync(manifestFilePath);
    if (
      !extensionManifest.isError &&
      (manifestFileStats.mtime > new Date(extension.updatedAt) ||
        gtSemver(extensionManifest.data.version, extension.version))
    ) {
      updateExtensionPayload = {
        ...updateExtensionPayload,
        ...mapManifestToDB.extension(extensionManifest.data),
      };

      const ids: string[] = [];
      await DBService.instance.extension.upsertCommands(
        extensionManifest.data.commands.map((command) => {
          const id = `${extension.id}:${command.name}`;

          return {
            id,
            extensionId: extension.id,
            ...mapManifestToDB.command(command),
          };
        }),
      );
      await DBService.instance.extension.deleteNotExistsCommand(ids);

      this.extensionsManifestPath.set(extension.id, extension.path);
    }

    await DBService.instance.db
      .update(extensionsSchema)
      .set(updateExtensionPayload)
      .where(eq(extensionsSchema.id, extension.id));

    return true;
  }

  async uninstallExtension(extensionId: string) {
    const commands =
      await DBService.instance.db.query.extensionCommands.findMany({
        columns: {
          id: true,
          name: true,
          shortcut: true,
        },
        where(fields, operators) {
          return operators.and(
            operators.eq(fields.extensionId, extensionId),
            operators.isNotNull(fields.shortcut),
          );
        },
      });
    commands.forEach((command) => {
      GlobalShortcut.instance.unregisterById(command.id);
    });

    await DBService.instance.extension.delete(extensionId);
  }

  async installExtension(extensionId: string) {
    try {
      const extensionExists =
        await DBService.instance.extension.exists(extensionId);
      if (extensionExists) return null;

      const extension =
        await API.extensions.getDownloadExtensionUrl(extensionId);
      const data = await afetch<ArrayBuffer>(extension.downloadUrl, {
        responseType: 'arrayBuffer',
      });

      const admZip = new AdmZip(Buffer.from(data), { fs: originalFs });

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

      return await this.importExtension(path.join(extDir, 'manifest.json'), {
        extensionId,
        isLocal: false,
      });
    } catch (error) {
      logger(
        'error',
        ['ExtensionService', 'install', `id:${extensionId}`],
        error,
      );
      throw error;
    }
  }
}

export default ExtensionLoader;
