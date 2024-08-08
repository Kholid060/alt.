import { Injectable, OnModuleInit } from '@nestjs/common';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs-extra';
import { ExtensionError } from '#packages/common/errors/custom-errors';
import { DATABASE_FOLDER } from '/@/common/utils/constant';

type SqliteDatabase = ReturnType<typeof Database>;

const BASE_EXT_DB_PATH = path.join(DATABASE_FOLDER, 'extensions');

const MAX_DB_IDLE_MS = 60_000; // 60 seconds
const CHECK_CONNECTION_INTERVAL_MS = 60_000; // 60 seconds

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

  query(
    extensionId: string,
    {
      query,
      dbPath,
      selectAll,
      params = [],
    }: {
      query: string;
      dbPath?: string;
      params?: unknown[];
      selectAll?: boolean;
    },
  ) {
    let database =
      this.DBs[dbPath ? `${extensionId}:${dbPath}` : extensionId]?.database;
    if (!database) {
      database = dbPath
        ? new Database(dbPath, { fileMustExist: true })
        : new Database(path.join(BASE_EXT_DB_PATH, extensionId));
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

  async deleteDB(extensionId: string) {
    await fs.remove(path.join(BASE_EXT_DB_PATH, extensionId));
  }
}
