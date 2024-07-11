import type {
  ExtensionCommand,
  ExtensionManifest,
} from '@altdot/extension/dist/extension-manifest';
import type { SQL } from 'drizzle-orm';
import { getTableColumns, sql } from 'drizzle-orm';
import type { SQLiteSelect, SQLiteTable } from 'drizzle-orm/sqlite-core';
import type {
  NewExtension,
  NewExtensionCommand,
} from '/@/db/schema/extension.schema';

export function buildConflictUpdateColumns<
  T extends SQLiteTable,
  Q extends keyof T['_']['columns'],
>(table: T, columns: Q[]) {
  const cls = getTableColumns(table);
  return columns.reduce(
    (acc, column) => {
      const colName = cls[column].name;
      acc[column] = sql.raw(`excluded.${colName}`);
      return acc;
    },
    {} as Record<Q, SQL>,
  );
}

export const mapManifestToDB = {
  extension({
    icon,
    name,
    title,
    config,
    author,
    version,
    credentials,
    description,
    permissions,
  }: ExtensionManifest): Omit<NewExtension, 'id' | 'path'> {
    return {
      name,
      icon,
      title,
      author,
      config,
      version,
      credentials,
      description,
      permissions,
    };
  },
  command({
    name,
    type,
    icon,
    title,
    config,
    context,
    subtitle,
    description,
    arguments: commandArguments,
  }: ExtensionCommand): Omit<NewExtensionCommand, 'extensionId' | 'id'> {
    return {
      name,
      icon,
      type,
      title,
      config,
      context,
      subtitle,
      description,
      arguments: commandArguments,
    };
  },
};

export function withPagination<T extends SQLiteSelect>(
  qb: T,
  page: number = 1,
  pageSize: number = 10,
) {
  return qb.limit(pageSize).offset((page - 1) * pageSize);
}

export function conflictUpdateAllExcept<
  T extends SQLiteTable,
  E extends (keyof T['$inferInsert'])[],
>(table: T, except: E) {
  const columns = getTableColumns(table);
  const updateColumns = Object.entries(columns).filter(
    ([col]) => !except.includes(col as keyof typeof table.$inferInsert),
  );

  return updateColumns.reduce(
    (acc, [colName, table]) => ({
      ...acc,
      [colName]: sql.raw(`excluded.${table.name}`),
    }),
    {},
  ) as Omit<Record<keyof typeof table.$inferInsert, SQL>, E[number]>;
}
