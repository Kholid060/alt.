import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs-extra';
import { DATABASE_FOLDER } from '../constant';
import { ExtensionError } from '#packages/common/errors/ExtensionError';

type SqliteDatabase = ReturnType<typeof Database>;

const BASE_EXT_DB_PATH = path.join(DATABASE_FOLDER, 'extensions');

const MAX_DB_IDLE_MS = 60_000; // 60 seconds
const CHECK_CONNECTION_INTERVAL_MS = 60_000; // 60 seconds

class ExtensionSqlite {
  private static _instance: ExtensionSqlite | null = null;
  static get instance() {
    if (!this._instance) {
      this._instance = new ExtensionSqlite();
    }

    return this._instance;
  }

  private checkConnectionInterval: NodeJS.Timeout | null = null;
  private DBs: Record<
    string,
    { lastQueryTime: number; database: SqliteDatabase }
  > = {};

  constructor() {
    fs.ensureDirSync(BASE_EXT_DB_PATH);
  }

  private checkConnections() {
    if (this.checkConnectionInterval) return;

    this.checkConnectionInterval = setInterval(() => {
      Object.keys(this.DBs).forEach((key) => {
        const { lastQueryTime, database } = this.DBs[key];
        const connectionAge = Date.now() - lastQueryTime;
        if (connectionAge < MAX_DB_IDLE_MS) return;

        database.close();
        delete this.DBs[key];
      });

      if (Object.keys(this.DBs).length !== 0) return;

      clearInterval(this.checkConnectionInterval as NodeJS.Timeout);
      this.checkConnectionInterval = null;
    }, CHECK_CONNECTION_INTERVAL_MS);
  }

  query(
    extensionId: string,
    {
      query,
      selectAll,
      params = [],
    }: { query: string; selectAll?: boolean; params?: unknown[] },
  ) {
    let database = this.DBs[extensionId]?.database;
    if (!database) {
      database = new Database(path.join(BASE_EXT_DB_PATH, extensionId));
      this.DBs[extensionId] = {
        database,
        lastQueryTime: Date.now(),
      };
    }

    this.checkConnections();
    this.DBs[extensionId].lastQueryTime = Date.now();

    try {
      const dbQuery = database.prepare(query);
      return selectAll ? dbQuery.all(params) : dbQuery.get(...params);
    } catch (error) {
      throw new ExtensionError((error as Error).message);
    }
  }

  closeDB(extensionId: string) {
    if (!this.DBs[extensionId]) return;

    this.DBs[extensionId].database.close();
    delete this.DBs[extensionId];

    if (Object.keys(this.DBs).length === 0 && this.checkConnectionInterval) {
      clearInterval(this.checkConnectionInterval);
    }
  }
}

export default ExtensionSqlite;
