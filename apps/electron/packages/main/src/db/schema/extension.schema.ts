import { sql } from 'drizzle-orm';
import { text, integer, sqliteTable, blob } from 'drizzle-orm/sqlite-core';

export const extensionsStorage = sqliteTable('extensions-storage', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  createdAt: text('createdAt')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updatedAt')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  extensionId: text('extensionId').notNull(),
  key: text('key').notNull(),
  value: blob('value', { mode: 'buffer' }).notNull(),
});

export type NewExtensionStorage = typeof extensionsStorage.$inferInsert;
