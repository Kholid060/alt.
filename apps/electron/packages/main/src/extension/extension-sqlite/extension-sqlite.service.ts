import { Injectable, OnModuleInit } from '@nestjs/common';
import Database, { type Database as DatabaseType } from 'better-sqlite3';
import path from 'path';
import fs from 'fs-extra';
import { ExtensionError } from '#packages/common/errors/custom-errors';
import { DATABASE_FOLDER } from '/@/common/utils/constant';

type SqliteDatabase = ReturnType<typeof Database>;

const BASE_EXT_DB_PATH = path.join(DATABASE_FOLDER, 'extensions');

const MAX_DB_IDLE_MS = 5 * 60 * 1000; // 5 minutes
const CHECK_CONNECTION_INTERVAL_MS = 60_000; // 60 seconds

const getDBKey = (extensionId: string, dbPath?: string) =>
  dbPath ? `${extensionId}:${dbPath}` : extensionId;

@Injectable()
export class ExtensionSqliteService implements OnModuleInit {
  private checkConnectionInterval: NodeJS.Timeout | null = null;
  private DBs: Record<
    string,
    { lastQueryTime: number; database: SqliteDatabase }
  > = {};

  constructor() {}

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

  onModuleInit() {
    fs.ensureDirSync(BASE_EXT_DB_PATH);
  }

  openDatabase(extensionId: string, dbPath?: string): DatabaseType {
    const dbKey = getDBKey(extensionId, dbPath);
    let database = this.DBs[dbKey]?.database;
    if (!database) {
      database = dbPath
        ? new Database(dbPath, { fileMustExist: true })
        : new Database(path.join(BASE_EXT_DB_PATH, extensionId));
      this.DBs[dbKey] = {
        database,
        lastQueryTime: Date.now(),
      };
    }

    return database;
  }

  query(
    extensionId: string,
    {
      query,
      dbPath,
      method,
      params = [],
    }: {
      query: string;
      dbPath?: string;
      params?: unknown[];
      method: 'get' | 'all' | 'run';
    },
  ) {
    const database = this.openDatabase(extensionId, dbPath);
    const dbKey = getDBKey(extensionId, dbPath);

    this.checkConnections();
    this.DBs[dbKey].lastQueryTime = Date.now();

    try {
      const dbQuery = database.prepare(query);
      return dbQuery[method](params);
    } catch (error) {
      throw new ExtensionError((error as Error).message);
    }
  }

  closeDB(extensionId: string, dbPath?: string) {
    const dbKey = getDBKey(extensionId, dbPath);
    if (!this.DBs[dbKey]) return;

    this.DBs[dbKey].database.close();
    delete this.DBs[dbKey];

    if (Object.keys(this.DBs).length === 0 && this.checkConnectionInterval) {
      clearInterval(this.checkConnectionInterval);
    }
  }

  execute(extensionId: string, sql: string, dbPath?: string) {
    const database = this.openDatabase(extensionId, dbPath);
    database.exec(sql);
  }

  async deleteDB(extensionId: string) {
    await fs.remove(path.join(BASE_EXT_DB_PATH, extensionId));
  }
}
