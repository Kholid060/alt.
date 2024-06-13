import crypto from 'crypto';
import fs from 'fs-extra';
import DBService from '../services/database/database.service';
import path from 'path';
import { APP_BACKUP_FILE_EXT } from '#packages/common/utils/constant/app.const';
import { CustomError } from '#packages/common/errors/custom-errors';
import { parseJSON } from '@alt-dot/shared';
import { z } from 'zod';
import { workflowFileSchema } from '../services/workflow.service';
import { logger } from '../lib/log';
import { fromZodError } from 'zod-validation-error';
import type { DatabaseWorkflowUpsertPayload } from '../interface/database.interface';
import type { DatabaseWorkflowInsertPayload } from '../interface/database.interface';
import { EXTENSION_BUILT_IN_ID } from '#packages/common/utils/constant/extension.const';
import { EXTENSION_COMMAND_TYPE } from '@alt-dot/extension-core';
import { DATABASE_CHANGES_ALL_ARGS } from '#packages/common/utils/constant/constant';
import { emitDBChanges } from './database-utils';
import AppSettingsService from '../services/app-settings.service';

const EXT_NAME = `.${APP_BACKUP_FILE_EXT}`;

const ENCRYPTION_KEY: string = import.meta.env.VITE_SECRET_DATA_KEY || ''; // Must be 256 bits (32 characters)
const IV_LENGTH: number = 16; // For AES, this is always 16

function encrypt(plainText: string, keyHex: string = ENCRYPTION_KEY) {
  const iv = crypto.randomBytes(IV_LENGTH); // Directly use Buffer returned by randomBytes
  const key = crypto.createHash('sha256').update(keyHex).digest();

  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plainText, 'utf8'),
    cipher.final(),
  ]);

  // Return iv and encrypted data as hex, combined in one line
  return Buffer.from(iv.toString('hex') + ':' + encrypted.toString('hex'));
}

function decrypt(text: string, keyHex: string = ENCRYPTION_KEY): string {
  const [ivHex, encryptedHex] = text.split(':');
  if (!ivHex || !encryptedHex) {
    throw new Error('Invalid or corrupted cipher format');
  }

  const key = crypto.createHash('sha256').update(keyHex).digest();
  const encryptedText = Buffer.from(encryptedHex, 'hex');
  const decipher = crypto.createDecipheriv(
    'aes-256-cbc',
    key,
    Buffer.from(ivHex, 'hex'),
  );
  const decrypted = Buffer.concat([
    decipher.update(encryptedText),
    decipher.final(),
  ]);

  return decrypted.toString();
}

const backupFileSchema = z.object({
  workflows: workflowFileSchema
    .merge(z.object({ id: z.string() }))
    .array()
    .optional(),
  extensions: z
    .object({
      id: z.string(),
      isDisabled: z.boolean(),
      commands: z
        .object({
          id: z.string(),
          name: z.string(),
          title: z.string(),
          extensionId: z.string(),
          isDisabled: z.boolean(),
          path: z.string().nullable(),
          alias: z.string().nullable(),
          shortcut: z.string().nullable(),
          isFallback: z.boolean().nullable(),
          type: z.enum(EXTENSION_COMMAND_TYPE),
        })
        .array(),
    })
    .array()
    .optional(),
  settings: z.object({
    startup: z.boolean(),
    upsertRestoreDuplicate: z.boolean(),
    clearStateAfter: z.number().max(90).min(1),
  }),
});
type BackupData = z.infer<typeof backupFileSchema>;

async function restoreWorkflows(
  workflows: BackupData['workflows'],
  upsert: boolean,
) {
  if (!workflows?.length) return;

  if (upsert) {
    await DBService.instance.workflow.upsert(
      workflows as DatabaseWorkflowUpsertPayload[],
    );
    return;
  }

  await DBService.instance.workflow.insert(
    workflows as unknown as DatabaseWorkflowInsertPayload[],
  );
}

async function restoreExtensions(extensions: BackupData['extensions']) {
  if (!extensions?.length) return;

  await DBService.instance.db.transaction(async (tx) => {
    for (const extension of extensions) {
      if (extension.id === EXTENSION_BUILT_IN_ID.userScript) {
        await DBService.instance.extension.upsertCommands(
          extension.commands,
          tx,
        );
        continue;
      }

      // TODO: Fetxh extension from server if not installed; else => update existing command
    }
  });
}

class BackupRestoreData {
  static async backup(filePath: string) {
    if (path.extname(filePath) !== EXT_NAME) {
      throw new Error('Invalid alt. backup file');
    }

    const [workflows, extensions] = await Promise.all([
      DBService.instance.workflow.getBackupData(),
      DBService.instance.extension.getBackupData(),
    ]);
    const data = encrypt(
      JSON.stringify({
        workflows,
        extensions,
        settings: AppSettingsService.get(),
      }),
    );

    await fs.writeFile(filePath, data);
  }

  static async restore(filePath: string, upsertDuplicate = true) {
    try {
      if (path.extname(filePath) !== EXT_NAME) {
        throw new Error('Invalid alt. backup file');
      }

      const encryptedData = await fs.readFile(filePath, {
        encoding: 'utf8',
      });
      const decryptedData = decrypt(encryptedData);
      const data = await backupFileSchema.safeParseAsync(
        parseJSON(decryptedData, {}),
      );

      if (!data.success) {
        logger(
          'error',
          ['BackupRestoreData', 'restore'],
          `{${path.basename(filePath)}} ${fromZodError(data.error)}`,
        );
        throw new CustomError('Invalid backup file');
      }

      const promises: Promise<unknown>[] = [];
      if (data.data.workflows?.length) {
        promises.push(
          upsertDuplicate
            ? DBService.instance.workflow.upsert(
                data.data.workflows as DatabaseWorkflowUpsertPayload[],
              )
            : DBService.instance.workflow.insert(
                data.data
                  .workflows as unknown as DatabaseWorkflowInsertPayload[],
              ),
        );
      }

      await Promise.all([
        restoreWorkflows(data.data.workflows, upsertDuplicate),
        restoreExtensions(data.data.extensions),
      ]);

      AppSettingsService.set(data.data.settings);

      emitDBChanges({
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

export default BackupRestoreData;
