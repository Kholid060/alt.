import type { CredentialType } from '#common/interface/credential.interface';
import type {
  ExtensionCommand,
  ExtensionCommandArgument,
  ExtensionConfig,
  ExtensionPermissions,
} from '@altdot/extension/dist/extension-manifest';
import type { ExtensionCredential } from '@altdot/extension/dist/extension-manifest/manifest-credential';
import { relations, sql } from 'drizzle-orm';
import {
  text,
  integer,
  sqliteTable,
  blob,
  uniqueIndex,
  index,
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
    ExtensionPermissions[]
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
  errors: many(extensionErrors),
  configs: many(extensionConfigs),
  storages: many(extensionStorages),
  commands: many(extensionCommands),
  credentials: many(extensionCreds),
  oauthTokens: many(extensionOAuthTokens),
}));

export const extensionCommands = sqliteTable('extension_commands', {
  // extensionId:commandName
  id: text('id').primaryKey(),
  shortcut: text('shortcut').unique(),
  icon: text('icon'),
  type: text('type').$type<ExtensionCommand['type']>().notNull(),
  subtitle: text('subtitle'),
  customSubtitle: text('custom_subtitle'),
  description: text('description'),
  title: text('title').notNull(),
  name: text('name').notNull(),
  isInternal: integer('is_internal', { mode: 'boolean' }).default(false),
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
export type SelectExtensionCommand = typeof extensionCommands.$inferSelect;

export const commandsRelations = relations(extensionCommands, ({ one }) => ({
  extension: one(extensions, {
    references: [extensions.id],
    fields: [extensionCommands.extensionId],
  }),
}));

export const extensionStorages = sqliteTable(
  'extension_storages',
  {
    // extensionId:key
    id: text('id').notNull().primaryKey(),
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
    isSecure: integer('is_secure', { mode: 'boolean' }),
  },
  (table) => ({
    storageKeyIdx: index('storage_key_idx').on(table.key),
    storageExtensionIdIdx: index('storage_extension_id_idx').on(
      table.extensionId,
    ),
  }),
);
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
    encryptedValue: blob('encrypted_value', { mode: 'buffer' }),
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

export const extensionErrors = sqliteTable('extension_errors', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title'),
  extensionId: text('extension_id')
    .notNull()
    .references(() => extensions.id, { onDelete: 'cascade' }),
  message: text('message').notNull(),
  createdAt: text('created_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});
export type NewExtensionError = typeof extensionErrors.$inferInsert;
export type SelectExtensionError = typeof extensionErrors.$inferSelect;

export const extensionErrorsRelations = relations(
  extensionErrors,
  ({ one }) => ({
    extension: one(extensions, {
      fields: [extensionErrors.extensionId],
      references: [extensions.id],
    }),
  }),
);

export const extensionOAuthTokens = sqliteTable(
  'extension_oauth_tokens',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    clientId: text('client_id').notNull(),
    expiresTimestamp: integer('expires_timestamp'),
    createdAt: text('created_at')
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text('updated_at')
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    providerName: text('provider_name').notNull(),
    providerIcon: text('provider_icon').notNull(),
    scope: text('scope'),
    key: text('key').notNull(),
    tokenType: text('token_type'),
    extensionId: text('extension_id')
      .notNull()
      .references(() => extensions.id, { onDelete: 'cascade' }),
    refreshToken: blob('refresh_token', { mode: 'buffer' }),
    accessToken: blob('access_token', { mode: 'buffer' }).notNull(),
  },
  (table) => ({
    oauthKeyIdx: index('oauth_key_idx').on(table.key),
    oauthClientIdIdx: index('oauth_client_id_idx').on(table.clientId),
    oauthExtensionIdIdx: index('oauth_ext_id_idx').on(table.extensionId),
  }),
);
export type NewExtensionOauthToken = typeof extensionOAuthTokens.$inferInsert;
export type SelectExtensionOauthToken =
  typeof extensionOAuthTokens.$inferSelect;

export const extensionsOAuthTokensRelations = relations(
  extensionOAuthTokens,
  ({ one }) => ({
    extension: one(extensions, {
      references: [extensions.id],
      fields: [extensionOAuthTokens.extensionId],
    }),
  }),
);

export const extensionCreds = sqliteTable('extension_credentials', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => nanoid()),
  name: text('name').notNull(),
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
  (table) => ({
    extensionOauthCredentialIdx: index('extension_oauth_credential_idx').on(
      table.credentialId,
    ),
  }),
);
export type NewExtensionCredentialOauthTokens =
  typeof extensionCredOauthTokens.$inferInsert;
export type SelectextensionCredentialOauthTokens =
  typeof extensionCredOauthTokens.$inferSelect;
