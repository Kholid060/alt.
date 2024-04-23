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

const dbPath = path.join(DATABASE_FOLDER, 'extensions.db');

export type SQLiteDatabaseSchema = typeof extensionsSchema &
  typeof workflowsSchema;
export type SQLiteDatabase = BetterSQLite3Database<SQLiteDatabaseSchema>;

class DBService {
  private static _instance: DBService | null = null;

  static get instance() {
    if (!this._instance) this._instance = new DBService();

    return this._instance;
  }

  intialized: boolean;
  db!: SQLiteDatabase;
  extension!: DBExtensionService;

  private sqlite!: BS3Database;

  constructor() {
    this.intialized = false;
  }

  @ErrorLogger('DBService', 'initDB')
  async initDB() {
    if (this.intialized) return;

    if (import.meta.env) console.log('Init Sqlite DB...');

    this.sqlite = new Database(dbPath);
    this.db = drizzle(this.sqlite, {
      schema: {
        ...extensionsSchema,
        ...workflowsSchema,
      },
    });

    this.extension = new DBExtensionService(this.db);

    migrate(this.db, {
      migrationsFolder: path.join(
        path.dirname(fileURLToPath(import.meta.url)),
        'migrations',
      ),
    });

    this.intialized = true;
  }

  close() {
    if (!this.intialized) return;

    this.sqlite.close();
  }
}

export default DBService;
