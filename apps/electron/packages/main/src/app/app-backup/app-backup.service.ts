import { Injectable } from '@nestjs/common';
import { DBService } from '../../db/db.service';
import { EXTENSION_BUILT_IN_ID } from '#packages/common/utils/constant/extension.const';
import { AppCryptoService } from '../app-crypto/app-crypto.service';
import dayjs from 'dayjs';
import { APP_BACKUP_FILE_EXT } from '#packages/common/utils/constant/app.const';
import { BrowserWindow, dialog } from 'electron';
import fs from 'fs-extra';
import path from 'path';
import {
  AppBackupFile,
  ExtensionCommandBackupValidation,
  appBackupFileValidation,
} from './app-backup.validation';
import { parseJSON } from '@alt-dot/shared';
import { LoggerService } from '../../logger/logger.service';
import { CustomError } from '#packages/common/errors/custom-errors';
import { fromZodError } from 'zod-validation-error';
import { workflows } from '../../db/schema/workflow.schema';
import { buildConflictUpdateColumns } from '/@/utils/database-utils';
import { SQLiteDatabaseTx } from '../../services/database/database.service';
import { extensionCommands } from '../../db/schema/extension.schema';
import { eq } from 'drizzle-orm';
import { ExtensionLoaderService } from '../../extension-loader/extension-loader.service';
import { DATABASE_CHANGES_ALL_ARGS } from '#packages/common/utils/constant/constant';
import { AppStoreService } from '../app-store/app-store.service';

const BACKUP_FILE_EXT_NAME = `.${APP_BACKUP_FILE_EXT}`;

@Injectable()
export class AppBackupService {
  constructor(
    private dbService: DBService,
    private logger: LoggerService,
    private appStore: AppStoreService,
    private appCrypto: AppCryptoService,
    private extensionLoader: ExtensionLoaderService,
  ) {}

  async getBackupData() {
    const [workflows, extensions] = await Promise.all([
      this.dbService.db.query.workflows.findMany({
        columns: {
          id: true,
          name: true,
          icon: true,
          edges: true,
          nodes: true,
          viewport: true,
          settings: true,
          variables: true,
          isDisabled: true,
          description: true,
        },
      }),
      this.dbService.db.query.extensions.findMany({
        columns: {
          id: true,
          isDisabled: true,
        },
        with: {
          commands: {
            columns: {
              id: true,
              name: true,
              path: true,
              type: true,
              alias: true,
              title: true,
              shortcut: true,
              isFallback: true,
              isDisabled: true,
              extensionId: true,
            },
          },
        },
        where(fields, operators) {
          return operators.eq(fields.isLocal, false);
        },
      }),
    ]);

    return {
      workflows,
      extensions,
      settings: this.appStore.getSettings(),
    };
  }

  private async restoreWorkflowsBackupData(
    workflowsData: Required<AppBackupFile>['workflows'],
    tx: SQLiteDatabaseTx,
    upsert = false,
  ) {
    const db = this.dbService.db || tx;
    if (upsert) {
      await db
        .insert(workflows)
        .values(workflowsData)
        .onConflictDoUpdate({
          target: workflows.id,
          set: {
            ...buildConflictUpdateColumns(workflows, [
              'name',
              'icon',
              'nodes',
              'edges',
              'viewport',
              'description',
            ]),
            updatedAt: new Date().toISOString(),
          },
        });
      return;
    }

    await db.insert(workflows).values(workflowsData);
  }

  private async restoreExtensionsBackupData(
    extensionsData: Required<AppBackupFile>['extensions'],
    tx: SQLiteDatabaseTx,
  ) {
    const extensionsIds = extensionsData.map(({ id }) => id);
    const existedExtensions = await tx.query.extensions.findMany({
      columns: {
        id: true,
      },
      with: {
        commands: {
          columns: { id: true },
        },
      },
      where(fields, operators) {
        return operators.inArray(fields.id, extensionsIds);
      },
    });

    const installedExtensionIds = new Set<string>([
      ...Object.values(EXTENSION_BUILT_IN_ID),
      ...existedExtensions.map((extension) => extension.id),
    ]);

    const updateExtensionCommand = async (
      extensionId: string,
      command: ExtensionCommandBackupValidation,
    ) => {
      try {
        await tx
          .update(extensionCommands)
          .set(command)
          .where(eq(extensionCommands.id, `${extensionId}:${command.name}`));
      } catch (error) {
        this.logger.error(
          ['BackupService', 'extension', 'command', extensionId, command.name],
          error,
        );
      }
    };

    await Promise.all(
      extensionsData.map(async (extension) => {
        try {
          if (!installedExtensionIds.has(extension.id)) {
            await this.extensionLoader.installExtension(extension.id, true);
          }

          // use CASE?
          await Promise.all(
            extension.commands.map((command) =>
              updateExtensionCommand(extension.id, command),
            ),
          );
          return;
        } catch (error) {
          // TODO: Show user which extension is error?
          this.logger.error(
            ['BackupService', 'extension', extension.id],
            error,
          );
        }
      }),
    );
  }

  async backupDataToFile(browserWindow?: BrowserWindow | null) {
    const options: Electron.SaveDialogOptions = {
      title: 'Backup data',
      defaultPath: dayjs().format('YYYY-MM-DD HHmm'),
      filters: [
        { extensions: [BACKUP_FILE_EXT_NAME], name: 'alt. app backup file' },
      ],
    };
    const dir = await (browserWindow
      ? dialog.showSaveDialog(browserWindow, options)
      : dialog.showSaveDialog(options));
    if (dir.canceled) return false;

    const data = await this.getBackupData();
    const dataStr = this.appCrypto.encryptString(JSON.stringify(data));

    await fs.writeFile(dir.filePath[0], dataStr);

    return true;
  }

  async restoreBackupFromFile(browserWindow?: BrowserWindow | null) {
    const options: Electron.OpenDialogOptions = {
      title: 'Restore backup data',
      filters: [
        { extensions: [APP_BACKUP_FILE_EXT], name: 'alt. app backup file' },
      ],
    };
    const dir = await (browserWindow
      ? dialog.showOpenDialog(browserWindow, options)
      : dialog.showOpenDialog(options));
    if (dir.canceled) return false;

    await this.restoreBackup(dir.filePaths[0]);

    return true;
  }

  async restoreBackup(filePath: string, upsert = true) {
    try {
      if (path.extname(filePath) !== BACKUP_FILE_EXT_NAME) {
        throw new Error('Invalid alt. backup file');
      }

      const encryptedData = await fs.readFile(filePath, {
        encoding: 'utf8',
      });
      const decryptedData = this.appCrypto.decryptString(encryptedData);
      const backupData = await appBackupFileValidation.safeParseAsync(
        parseJSON(decryptedData, {}),
      );

      if (!backupData.success) {
        this.logger.error(
          ['BackupRestoreData', 'restore'],
          `{${path.basename(filePath)}} ${fromZodError(backupData.error)}`,
        );
        throw new CustomError('Invalid backup file');
      }

      await this.dbService.db.transaction(async (tx) => {
        if (backupData.data.workflows && backupData.data.workflows.length > 0) {
          await this.restoreWorkflowsBackupData(
            backupData.data.workflows,
            tx,
            upsert,
          );
        }

        if (
          backupData.data.extensions &&
          backupData.data.extensions.length > 0
        ) {
          await this.restoreExtensionsBackupData(
            backupData.data.extensions,
            tx,
          );
        }
      });

      this.appStore.setSettings(backupData.data.settings);

      this.dbService.emitChanges({
        'database:get-command': [DATABASE_CHANGES_ALL_ARGS],
        'database:get-command-list': [DATABASE_CHANGES_ALL_ARGS],
        'database:get-workflow-list': [DATABASE_CHANGES_ALL_ARGS],
        'database:get-extension-list': [DATABASE_CHANGES_ALL_ARGS],
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('BAD_DECRYPT')) {
        throw new CustomError('Unable  to decrypt the backup file');
      }

      throw error;
    }
  }
}
