import { blob, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const store = sqliteTable('store', {
  key: text('key').primaryKey().notNull(),
  value: blob('value', { mode: 'json' }).$type<{ $value: unknown }>(),
});
export type NewStore = typeof store.$inferInsert;
export type SelectStore = typeof store.$inferSelect;
