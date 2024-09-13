import { Inject, Injectable } from '@nestjs/common';
import path from 'path';
import crypto from 'node:crypto';
import { DBService } from '../db/db.service';
import ExtensionUtils from '../common/utils/ExtensionUtils';
import {
  CustomError,
  ValidationError,
} from '#packages/common/errors/custom-errors';
import { mapManifestToDB } from '/@/common/utils/database-utils';
import {
  extensionCommands,
  extensions,
  SelectExtension,
} from '../db/schema/extension.schema';
import { DATABASE_CHANGES_ALL_ARGS } from '#packages/common/utils/constant/constant';
import { ExtensionUpdaterService } from '../extension-updater/extension-updater.service';
import { GlobalShortcutService } from '../global-shortcut/global-shortcut.service';
import { eq } from 'drizzle-orm';
import { APIService } from '../api/api.service';
import { afetch } from '@altdot/shared';
import fs from 'fs-extra';
import AdmZip from 'adm-zip';
import originalFs from 'original-fs';
import { EXTENSION_FOLDER } from '/@/common/utils/constant';
import { LoggerService } from '../logger/logger.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { ExtensionSqliteService } from '../extension/extension-sqlite/extension-sqlite.service';
import { ExtensionWithCommandsModel } from '../extension/extension.interface';

@Injectable()
export class ExtensionLoaderService {
  private installingIds: Set<string> = new Set();

  constructor(
    private dbService: DBService,
    private logger: LoggerService,
    private apiService: APIService,
    private globalShortcut: GlobalShortcutService,
    private extensionSqlite: ExtensionSqliteService,
    private extensionUpdater: ExtensionUpdaterService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  getPath(
    extensionId: Pick<SelectExtension, 'path' | 'isLocal' | 'id'> | string,
    type: 'base' | 'icon' | 'libs',
    ...paths: string[]
  ) {
    return this.cacheManager.wrap(
      `ext-path:${extensionId}/${type}/${paths.join('/')}`,
      async () => {
        const extension =
          typeof extensionId === 'string'
            ? await this.dbService.db.query.extensions.findFirst({
                columns: { path: true, isLocal: true, id: true },
                where(fields, operators) {
                  return operators.eq(fields.id, extensionId);
                },
              })
            : extensionId;
        if (!extension) return null;

        let basePath = extension.isLocal
          ? extension.path
          : path.join(EXTENSION_FOLDER, extension.id);
        switch (type) {
          case 'base':
            break;
          case 'icon':
            basePath += '/icon';
            break;
          case 'libs':
            basePath += '/@libs';
            break;
        }

        return basePath + `${paths.length === 0 ? '' : `/${paths.join('/')}`}`;
      },
    );
  }

  async importExtension(
    manifestPath: string,
    {
      extensionId,
      isLocal = true,
    }: { extensionId?: string; isLocal?: boolean } = {},
  ): Promise<ExtensionWithCommandsModel | null> {
    const normalizeManifestPath = path.normalize(path.dirname(manifestPath));
    const findExtension = await this.dbService.db.query.extensions.findFirst({
      columns: {
        id: true,
      },
      where(fields, operators) {
        if (extensionId) operators.eq(fields.id, extensionId);

        return operators.eq(fields.path, normalizeManifestPath);
      },
    });
    if (findExtension) return null;

    const manifest = await ExtensionUtils.extractManifestFromPath(manifestPath);
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

    const result = await this.dbService.db.transaction(async (tx) => {
      const extension = await tx
        .insert(extensions)
        .values({
          id,
          isLocal,
          isDisabled: false,
          ...mapManifestToDB.extension(manifest.data),
          path: extensionId ? '' : normalizeManifestPath,
        })
        .returning();
      const commands = await tx
        .insert(extensionCommands)
        .values(
          manifest.data.commands.map((command) => ({
            id: `${id}:${command.name}`,
            extensionId: id,
            ...mapManifestToDB.command(command),
          })),
        )
        .returning();

      return { ...extension[0], commands };
    });

    this.dbService.emitChanges({
      'database:get-extension-list': [DATABASE_CHANGES_ALL_ARGS],
    });

    return result;
  }

  async reloadExtension(extId: string): Promise<boolean> {
    const extension = await this.dbService.db.query.extensions.findFirst({
      columns: {
        id: true,
        path: true,
        name: true,
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
    if (!extension) throw new CustomError("Couldn't find extension");
    if (!extension.isLocal) return false;

    const isUpdated = await this.extensionUpdater.updateExtension(extension);
    if (!isUpdated) return false;

    this.dbService.emitChanges({
      'database:get-extension': [extId],
      'database:get-extension-list': [DATABASE_CHANGES_ALL_ARGS],
    });

    return true;
  }

  async uninstallExtension(extensionId: string) {
    const extension = await this.dbService.db.query.extensions.findFirst({
      where(fields, operators) {
        return operators.eq(fields.id, extensionId);
      },
      with: {
        commands: true,
      },
    });
    if (!extension) throw new CustomError("Couldn't find extension");

    // unregister command shortcut
    extension.commands.forEach((command) => {
      this.globalShortcut.unregisterById(command.id);
    });

    // delete the extension database
    await this.extensionSqlite.deleteDB(extensionId);

    await this.dbService.db
      .delete(extensions)
      .where(eq(extensions.id, extensionId));
    this.dbService.emitChanges({
      'database:get-extension': [extensionId],
      'database:get-extension-list': [DATABASE_CHANGES_ALL_ARGS],
    });

    if (extension.isLocal) return;

    // delete extension folder
    const extDir = path.join(EXTENSION_FOLDER, extensionId);
    await fs.remove(extDir);
  }

  async installExtension(
    extensionId: string,
    hasValidated = false,
  ): Promise<ExtensionWithCommandsModel | null> {
    try {
      if (this.installingIds.has(extensionId)) return null;

      const findExtension = hasValidated
        ? false
        : await this.dbService.db.query.extensions.findFirst({
            columns: {
              id: true,
            },
            where(fields, operators) {
              return operators.eq(fields.id, extensionId);
            },
          });
      if (findExtension) return null;

      this.installingIds.add(extensionId);

      const extension =
        await this.apiService.extensions.getDownloadFileUrl(extensionId);
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

      /**
       * Create a dummy package.json file to set the type to module
       * otherwise it will throw "Cannot use import statement outside a module" error
       * when importing the extension command file in the extension worker
       */
      await fs.writeJSON(path.join(extDir, 'package.json'), {
        type: 'module',
        name: 'altdot-extension',
      });

      return await this.importExtension(path.join(extDir, 'manifest.json'), {
        extensionId,
        isLocal: false,
      });
    } catch (error) {
      this.logger.error(
        ['ExtensionService', 'install', `id:${extensionId}`],
        error,
      );
      throw error;
    } finally {
      // eslint-disable-next-line drizzle/enforce-delete-with-where
      this.installingIds.delete(extensionId);
    }
  }
}
