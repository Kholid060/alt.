import { Injectable } from '@nestjs/common';
import fs from 'fs-extra';
import eqSemver from 'semver/functions/eq';
import { OnAppReady } from '../common/hooks/on-app-ready.hook';
import { DBService } from '../db/db.service';
import { LoggerService } from '../logger/logger.service';
import path from 'path';
import ExtensionUtils from '../common/utils/ExtensionUtils';
import { APIService } from '../api/api.service';
import { afetch } from '@alt-dot/shared';
import AdmZip from 'adm-zip';
import originalFs from 'original-fs';
import { app } from 'electron';
import { nanoid } from 'nanoid';
import {
  ExtensionUpdaterExtension,
  ExtensionUpdaterPayload,
} from './interfaces/extension-updater.interface';
import { ExtensionUpdater } from './utils/extension-updater';
import { EXTENSION_BUILT_IN_ID } from '#packages/common/utils/constant/extension.const';
import { AppStoreService } from '../app/app-store/app-store.service';
import { DATABASE_CHANGES_ALL_ARGS } from '#packages/common/utils/constant/constant';

@Injectable()
export class ExtensionUpdaterService implements OnAppReady {
  constructor(
    private dbService: DBService,
    private logger: LoggerService,
    private apiService: APIService,
    private appStore: AppStoreService,
  ) {}

  onAppReady() {
    // to prevent blocking the startup process
    this.checkUpdate();
  }

  private async checkUpdate() {
    const lastCheckUpdate = this.appStore.get('lastCheckExtensionUpdate');
    const checkUpdate =
      !lastCheckUpdate ||
      new Date(lastCheckUpdate).getDate() !== new Date().getDate();
    if (!checkUpdate) return;

    this.logger.info('Start updating extensions');

    await this.dbService.db.transaction(async (tx) => {
      const extensions = await tx.query.extensions
        .findMany({
          columns: {
            id: true,
            name: true,
            path: true,
            isLocal: true,
            version: true,
            updatedAt: true,
          },
          where(fields, operators) {
            return operators.notInArray(
              fields.id,
              Object.values(EXTENSION_BUILT_IN_ID),
            );
          },
        })
        .then((result) =>
          result.reduce<{
            local: ExtensionUpdaterExtension[];
            store: ExtensionUpdaterExtension[];
          }>(
            (acc, curr) => {
              if (curr.isLocal) acc.local.push(curr);
              else acc.store.push(curr);

              return acc;
            },
            { local: [], store: [] },
          ),
        );

      const updateLocalExts = await this.getLocalExtUpdate(extensions.local);
      await Promise.all(
        updateLocalExts.map((extension) => {
          const updater = new ExtensionUpdater(tx, extension);
          return updater.startUpdate();
        }),
      );

      if (extensions.store.length === 0) return;
      const updateStoreExts = await this.getStoreExtUpdate(extensions.store);
      await Promise.all(
        updateStoreExts.map((extension) => {
          const updater = new ExtensionUpdater(tx, extension);
          return updater.startUpdate();
        }),
      );

      if (updateLocalExts.length > 0 || updateStoreExts.length > 0) {
        this.dbService.emitChanges({
          'database:get-extension': [DATABASE_CHANGES_ALL_ARGS],
          'database:get-extension-list': [DATABASE_CHANGES_ALL_ARGS],
        });
      }
    });

    this.appStore.set('lastCheckExtensionUpdate', new Date().toString());

    this.logger.info('Finish updating extensions');
  }

  async updateExtension(extension: ExtensionUpdaterExtension) {
    const [updatePayload] = await (extension.isLocal
      ? this.getLocalExtUpdate([extension])
      : this.getStoreExtUpdate([extension]));
    if (!updatePayload) return false;

    const updater = new ExtensionUpdater(this.dbService.db, updatePayload);
    await updater.startUpdate();

    return true;
  }

  private async getLocalExtUpdate(
    extensions: ExtensionUpdaterExtension[],
  ): Promise<ExtensionUpdaterPayload[]> {
    const result: ExtensionUpdaterPayload[] = [];
    await Promise.all(
      extensions.map(async (extension): Promise<void> => {
        try {
          const manifestPath = path.join(extension.path, 'manifest.json');
          const manifest =
            await ExtensionUtils.extractManifestFromPath(manifestPath);
          if (manifest.isError) {
            result.push({
              extDir: '', // no need, because it's local
              isError: true,
              extensionId: extension.id,
              extension: {
                isError: true,
                errorMessage: manifest.message,
              },
            });
            return;
          }

          const lastUpdated = new Date(extension.updatedAt);
          const manifestFileStat = await fs.stat(manifestPath);
          if (
            lastUpdated >= manifestFileStat.mtime &&
            !eqSemver(extension.version, manifest.data.version)
          )
            return;

          result.push({
            extDir: '',
            manifest: manifest.data,
            extensionId: extension.id,
          });
        } catch (error) {
          this.logger.error(
            `Error updating "${extension.name}" extension:`,
            error,
          );
        }
      }),
    );

    return result;
  }

  private async getStoreExtUpdate(
    extensions: ExtensionUpdaterExtension[],
  ): Promise<ExtensionUpdaterPayload[]> {
    try {
      const newUpdateExtensions = await this.apiService.extensions.checkUpdate(
        extensions.map((extension) => ({
          extensionId: extension.id,
          version: extension.version,
        })),
      );
      const result: ExtensionUpdaterPayload[] = [];

      await Promise.all(
        extensions.map(async (extension): Promise<void> => {
          try {
            const newUpdate = newUpdateExtensions.find(
              (item) => item.id === extension.id,
            );
            if (!newUpdate) return;

            const data = await afetch<ArrayBuffer>(newUpdate.fileUrl, {
              responseType: 'arrayBuffer',
            });
            const admZip = new AdmZip(Buffer.from(data), { fs: originalFs });

            const manifestFile = admZip.getEntry('manifest.json');
            if (!manifestFile || manifestFile.isDirectory) {
              throw new Error('Manifest file not found');
            }

            const manifest = await ExtensionUtils.extractManifest(
              manifestFile.getData().toString(),
            );
            if (manifest.isError) throw new Error(manifest.message);

            const extDir = path.join(
              app.getPath('temp'),
              `${extension.id}-${nanoid(4)}`,
            );
            await fs.ensureDir(extDir);
            await new Promise<void>((resolve, reject) => {
              admZip.extractAllToAsync(extDir, true, true, (error) => {
                if (error) return reject(error);

                resolve();
              });
            });

            result.push({
              extDir,
              manifest: manifest.data,
              extensionId: extension.id,
            });
          } catch (error) {
            this.logger.error(
              `Error updating "${extension.id}" extension:`,
              error,
            );
          }
        }),
      );

      return result;
    } catch (error) {
      this.logger.error('Error checking store extension update', error);

      return [];
    }
  }
}
