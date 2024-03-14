import { app } from 'electron';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';

console.log(app.getPath('userData'))

const extensionsDB = drizzle(sqlite);

migrate(extensionsDB, {
  migrationsFolder: path.join(__dirname, 'packages/main/dist/migrations')
});
