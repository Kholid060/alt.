import type { CredentialType } from '#packages/common/interface/credential.interface';
import type {
  EXTENSION_PERMISSIONS,
  ExtensionCommand,
  ExtensionCommandArgument,
  ExtensionConfig,
} from '@repo/extension-core';
import type { ExtensionCredential } from '@repo/extension-core/src/client/manifest/manifest-credential';
import { relations, sql } from 'drizzle-orm';
import {
  text,
  integer,
  sqliteTable,
  blob,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core';
import { nanoid } from 'nanoid';

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
  credentials: text('credentials', {
    mode: 'json',
  }).$type<ExtensionCredential[]>(),
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
  configs: many(extensionConfigs),
  storages: many(extensionStorages),
  commands: many(extensionCommands),
  credentials: many(extensionCreds),
}));

export const extensionCommands = sqliteTable('extension_commands', {
  id: text('id').primaryKey(),
  shortcut: text('shortcut').unique(),
  icon: text('icon'),
  type: text('type').$type<ExtensionCommand['type']>().notNull(),
  subtitle: text('subtitle'),
  customSubtitle: text('custom_subtitle'),
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
  alias: text('alias'),
  extensionId: text('extension_id')
    .notNull()
    .references(() => extensions.id, { onDelete: 'cascade' }),
  dismissAlert: integer('dismiss_alert', { mode: 'boolean' }),
});
export type NewExtensionCommand = typeof extensionCommands.$inferInsert;
export type SelectExtesionCommand = typeof extensionCommands.$inferSelect;

export const commandsRelations = relations(extensionCommands, ({ one }) => ({
  extension: one(extensions, {
    references: [extensions.id],
    fields: [extensionCommands.extensionId],
  }),
}));

export const extensionStorages = sqliteTable('extension_storages', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  createdAt: text('created_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  extensionId: text('extension_id')
    .notNull()
    .references(() => extensions.id, { onDelete: 'cascade' }),
  key: text('key').notNull(),
  value: blob('value', { mode: 'buffer' }).notNull(),
});
export type NewExtensionStorage = typeof extensionStorages.$inferInsert;
export type SelectExtensionStorage = typeof extensionStorages.$inferSelect;

export const extensionsStorageRelations = relations(
  extensionStorages,
  ({ one }) => ({
    extension: one(extensions, {
      fields: [extensionStorages.extensionId],
      references: [extensions.id],
    }),
  }),
);

export const extensionConfigs = sqliteTable(
  'extension_configs',
  {
    id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
    extensionId: text('extension_id')
      .notNull()
      .references(() => extensions.id, { onDelete: 'cascade' }),
    configId: text('config_id').unique().notNull(),
    value: text('value', { mode: 'json' })
      .notNull()
      .$type<Record<string, unknown>>(),
  },
  (table) => ({
    configIdIdx: uniqueIndex('config_id_idx').on(table.configId),
  }),
);
export type NewExtensionConfig = typeof extensionConfigs.$inferInsert;
export type SelectExtensionConfig = typeof extensionConfigs.$inferSelect;

export const extensionsConfigRelations = relations(
  extensionConfigs,
  ({ one }) => ({
    extension: one(extensions, {
      fields: [extensionConfigs.extensionId],
      references: [extensions.id],
    }),
  }),
);

export const extensionCreds = sqliteTable('extension_credentials', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => nanoid()),
  name: text('name'),
  extensionId: text('extension_id')
    .notNull()
    .references(() => extensions.id, { onDelete: 'cascade' }),
  createdAt: text('created_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  providerId: text('provider_id').notNull(),
  value: blob('value', { mode: 'buffer' }).notNull(),
  type: text('type').notNull().$type<CredentialType>().default('oauth2'),
});
export type NewExtensionCredential = typeof extensionCreds.$inferInsert;
export type SelectExtensionCredential = typeof extensionCreds.$inferSelect;

export const extensionCredsRelations = relations(extensionCreds, ({ one }) => ({
  extension: one(extensions, {
    references: [extensions.id],
    fields: [extensionCreds.extensionId],
  }),
  oauthToken: one(extensionCredOauthTokens, {
    fields: [extensionCreds.id],
    references: [extensionCredOauthTokens.credentialId],
  }),
}));

export const extensionCredOauthTokens = sqliteTable(
  'extension_credential_oauth_tokens',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    credentialId: text('credential_id')
      .notNull()
      .references(() => extensionCreds.id, { onDelete: 'cascade' }),
    expiresTimestamp: integer('expires_timestamp').notNull(),
    createdAt: text('created_at')
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text('updated_at')
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    scope: text('scope'),
    tokenType: text('token_type'),
    refreshToken: blob('refresh_token', { mode: 'buffer' }),
    accessToken: blob('access_token', { mode: 'buffer' }).notNull(),
  },
);
export type NewExtensionCredentialOauthTokens =
  typeof extensionCredOauthTokens.$inferInsert;
export type SelectextensionCredentialOauthTokens =
  typeof extensionCredOauthTokens.$inferSelect;
