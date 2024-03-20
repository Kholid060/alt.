import { relations, sql } from 'drizzle-orm';
import { text, integer, sqliteTable, blob } from 'drizzle-orm/sqlite-core';

export const extensions = sqliteTable('extensions', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  path: text('path').notNull(),
  title: text('title').notNull(),
  version: text('version').notNull(),
  description: text('description').notNull(),
  isLocal: integer('isLocal', { mode: 'boolean' })
    .notNull()
    .$default(() => false),
  createdAt: text('createdAt')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updatedAt')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});
export type NewExtension = typeof extensions.$inferInsert;

export const extensionsRelations = relations(extensions, ({ many }) => ({
  storages: many(extensionsStorage),
}));

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

export const extensionsStorageRelations = relations(
  extensionsStorage,
  ({ one }) => ({
    extension: one(extensions, {
      fields: [extensionsStorage.extensionId],
      references: [extensions.id],
    }),
  }),
);
