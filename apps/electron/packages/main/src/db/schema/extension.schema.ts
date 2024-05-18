import type {
  EXTENSION_PERMISSIONS,
  ExtensionCommand,
  ExtensionCommandArgument,
  ExtensionConfig,
} from '@repo/extension-core';
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
  author: text('author').notNull(),
  version: text('version').notNull(),
  errorMessage: text('error_message'),
  description: text('description').notNull(),
  permissions: text('permissions', { mode: 'json' }).$type<
    (typeof EXTENSION_PERMISSIONS)[number][]
  >(),
  config: text('config', { mode: 'json' }).$type<ExtensionConfig[]>(),
  isError: integer('is_error', { mode: 'boolean' })
    .notNull()
    .$default(() => false),
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
  commands: many(commands),
}));

export const commands = sqliteTable('commands', {
  id: text('id').primaryKey(),
  shortcut: text('shortcut').unique(),
  icon: text('icon'),
  type: text('type').$type<ExtensionCommand['type']>().notNull(),
  subtitle: text('subtitle'),
  description: text('description'),
  title: text('title').notNull(),
  name: text('name').notNull(),
  path: text('path'),
  context: text('context', { mode: 'json' }).$type<
    ('all' | `host:${string}`)[]
  >(),
  config: text('config', { mode: 'json' }).$type<ExtensionConfig[]>(),
  arguments: text('arguments', { mode: 'json' }).$type<
    ExtensionCommandArgument[]
  >(),
  isDisabled: integer('is_disabled', { mode: 'boolean' })
    .notNull()
    .$default(() => false),
  isFallback: integer('is_fallback', { mode: 'boolean' }),
  extensionId: text('extension_id').notNull(),
  dismissAlert: integer('dismiss_alert', { mode: 'boolean' }),
});
export type NewExtensionCommand = typeof commands.$inferInsert;
export type SelectExtesionCommand = typeof commands.$inferSelect;

export const commandsRelations = relations(commands, ({ one }) => ({
  extension: one(extensions, {
    references: [extensions.id],
    fields: [commands.extensionId],
  }),
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
    value: text('value', { mode: 'json' })
      .notNull()
      .$type<Record<string, unknown>>(),
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
