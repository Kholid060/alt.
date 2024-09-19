import fs from 'fs-extra';
import {
  Injectable,
  OnApplicationShutdown,
  OnModuleInit,
} from '@nestjs/common';
import Database, { Database as BS3Database } from 'better-sqlite3';
import { BetterSQLite3Database, drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import path from 'path';
import { fileURLToPath } from 'url';
import * as workflowsSchema from '/@/db/schema/workflow.schema';
import * as extensionsSchema from '/@/db/schema/extension.schema';
import * as storeSchema from '/@/db/schema/store.schema';
import { debugLog } from '#packages/common/utils/helper';
import { DatabaseQueriesEvent } from '../interface/database.interface';
import { DATABASE_CHANGES_ALL_ARGS } from '#packages/common/utils/constant/constant';
import { BrowserWindow } from 'electron';
import { DATABASE_FOLDER } from '../common/utils/constant';

const DB_PATH = path.join(DATABASE_FOLDER, 'extensions.db');

export type SQLiteDatabaseSchema = typeof extensionsSchema &
  typeof workflowsSchema &
  typeof storeSchema;
export type SQLiteDatabase = BetterSQLite3Database<SQLiteDatabaseSchema>;
export type SQLiteDatabaseTx = Parameters<
  Parameters<SQLiteDatabase['transaction']>[0]
>[0];

@Injectable()
export class DBService implements OnModuleInit, OnApplicationShutdown {
  private connection!: BS3Database;

  db!: SQLiteDatabase;

  constructor() {}

  async onModuleInit() {
    await fs.ensureFile(DB_PATH);

    debugLog('Init Sqlite DB...');

    this.connection = new Database(DB_PATH);
    this.db = drizzle(this.connection, {
      schema: {
        ...storeSchema,
        ...workflowsSchema,
        ...extensionsSchema,
      },
    });

    migrate(this.db, {
      migrationsFolder: path.join(
        path.dirname(fileURLToPath(import.meta.url)),
        'migrations',
      ),
    });
  }

  onApplicationShutdown() {
    this.connection.close();
  }

  emitChanges(changes: {
    [T in keyof Partial<DatabaseQueriesEvent>]:
      | [typeof DATABASE_CHANGES_ALL_ARGS]
      | Parameters<DatabaseQueriesEvent[T]>;
  }) {
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('database:changes', changes);
    });
  }
}
