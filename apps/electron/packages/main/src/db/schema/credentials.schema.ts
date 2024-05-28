import { blob, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { nanoid } from 'nanoid';
import type { CredentialType } from '#common/interface/credential.interface';

export const credentials = sqliteTable('credentials', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => nanoid()),
  extensionId: text('extension_id'),
  value: blob('value', { mode: 'buffer' }).notNull(),
  type: text('type').notNull().$type<CredentialType>().default('oauth2'),
});
export type NewCredential = typeof credentials.$inferInsert;
export type SelectCredential = typeof credentials.$inferSelect;
