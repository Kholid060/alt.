import { relations, sql } from 'drizzle-orm';
import {
  text,
  integer,
  sqliteTable,
  blob,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core';

export const extensions = sqliteTable('extensions', {
  id: text('id').primaryKey(),
  icon: text('icon').notNull(),
  name: text('name').notNull(),
  path: text('path').notNull(),
  title: text('title').notNull(),
  version: text('version').notNull(),
  description: text('description').notNull(),
  isDisabled: integer('is_disabled', { mode: 'boolean' })
    .notNull()
    .$default(() => false),
  isLocal: integer('is_local', { mode: 'boolean' })
    .notNull()
    .$default(() => false),
  createdAt: text('created_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});
export type NewExtension = typeof extensions.$inferInsert;
export type SelectExtension = typeof extensions.$inferSelect;

export const extensionsRelations = relations(extensions, ({ many }) => ({
  configs: many(configs),
  storages: many(storages),
}));

export const storages = sqliteTable('storages', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  createdAt: text('created_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  extensionId: text('extension_id').notNull(),
  key: text('key').notNull(),
  value: blob('value', { mode: 'buffer' }).notNull(),
});
export type NewExtensionStorage = typeof storages.$inferInsert;
export type SelectExtensionStorage = typeof storages.$inferSelect;

export const extensionsStorageRelations = relations(storages, ({ one }) => ({
  extension: one(extensions, {
    fields: [storages.extensionId],
    references: [extensions.id],
  }),
}));

export const configs = sqliteTable(
  'configs',
  {
    id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
    extensionId: text('extension_id').notNull(),
    configId: text('config_id').unique().notNull(),
    value: text('value', { mode: 'json' }).notNull(),
  },
  (table) => ({
    configIdIdx: uniqueIndex('config_id_idx').on(table.configId),
  }),
);
export type NewExtensionConfig = typeof configs.$inferInsert;
export type SelectExtensionConfig = typeof configs.$inferSelect;

export const extensionsConfigRelations = relations(configs, ({ one }) => ({
  extension: one(extensions, {
    fields: [configs.extensionId],
    references: [extensions.id],
  }),
}));
