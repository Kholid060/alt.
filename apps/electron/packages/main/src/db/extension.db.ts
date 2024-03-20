import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs-extra';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { DATABASE_FOLDER } from '../utils/constant';
import { fileURLToPath } from 'url';
import { app } from 'electron';
import * as extensionsSchema from './schema/extension.schema';

fs.ensureDir(DATABASE_FOLDER);

const dbPath = path.join(DATABASE_FOLDER, 'extensions.db');

const sqlite = new Database(dbPath);
const extensionsDB = drizzle(sqlite, {
  schema: { ...extensionsSchema },
});

migrate(extensionsDB, {
  migrationsFolder: path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    'migrations',
  ),
});

app.on('window-all-closed', () => {
  sqlite.close();
});

export default extensionsDB;
