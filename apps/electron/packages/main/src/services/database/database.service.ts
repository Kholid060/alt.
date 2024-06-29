import Database, { type Database as BS3Database } from 'better-sqlite3';
import DBExtensionService from './database-extension.service';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as workflowsSchema from '/@/db/schema/workflow.schema';
import * as extensionsSchema from '/@/db/schema/extension.schema';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import path from 'path';
import { fileURLToPath } from 'url';
import { DATABASE_FOLDER } from '/@/utils/constant';
import { ErrorLogger } from '/@/lib/log';
import DBWorkflowService from './database-workflow.service';
import fs from 'fs-extra';
import { debuglog } from 'util';

const dbPath = path.join(DATABASE_FOLDER, 'extensions.db');

export type SQLiteDatabaseSchema = typeof extensionsSchema &
  typeof workflowsSchema;
export type SQLiteDatabase = BetterSQLite3Database<SQLiteDatabaseSchema>;
export type SQLiteDatabaseTx = Parameters<
  Parameters<BetterSQLite3Database<SQLiteDatabaseSchema>['transaction']>[0]
>[0];

class DatabaseService {
  private static _instance: DatabaseService | null = null;

  static get instance() {
    if (!this._instance) this._instance = new DatabaseService();

    return this._instance;
  }

  intialized: boolean;
  db!: SQLiteDatabase;

  workflow!: DBWorkflowService;
  extension!: DBExtensionService;

  private sqlite!: BS3Database;

  constructor() {
    this.intialized = false;
  }

  @ErrorLogger('DBService', 'initDB')
  async initDB() {
    if (this.intialized) return;

    await fs.ensureFile(dbPath);

    debuglog('Init Sqlite DB...');

    this.sqlite = new Database(dbPath);
    this.db = drizzle(this.sqlite, {
      schema: {
        ...extensionsSchema,
        ...workflowsSchema,
      },
    });

    this.workflow = new DBWorkflowService(this.db);
    this.extension = new DBExtensionService(this.db);

    migrate(this.db, {
      migrationsFolder: path.join(
        path.dirname(fileURLToPath(import.meta.url)),
        'migrations',
      ),
    });

    await Promise.all([this.extension.$initialData()]);

    this.intialized = true;
  }

  close() {
    if (!this.intialized) return;

    this.sqlite.close();
  }
}

export default DatabaseService;
