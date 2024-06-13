import type { ExtensionCommand, ExtensionManifest } from '@alt-dot/extension-core';
import type { SQL } from 'drizzle-orm';
import { getTableColumns, sql } from 'drizzle-orm';
import type { SQLiteSelect, SQLiteTable } from 'drizzle-orm/sqlite-core';
import type {
  NewExtension,
  NewExtensionCommand,
} from '../db/schema/extension.schema';
import type { DATABASE_CHANGES_ALL_ARGS } from '#packages/common/utils/constant/constant';
import type { DatabaseQueriesEvent } from '../interface/database.interface';
import WindowsManager from '../window/WindowsManager';
import type { WindowNames } from '#packages/common/interface/window.interface';

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

export function emitDBChanges(
  changes: {
    [T in keyof Partial<DatabaseQueriesEvent>]:
      | [typeof DATABASE_CHANGES_ALL_ARGS]
      | Parameters<DatabaseQueriesEvent[T]>;
  },
  excludeWindow?: (WindowNames | number)[],
) {
  WindowsManager.sendMessageToAllWindows({
    excludeWindow,
    args: [changes],
    name: { name: 'database:changes', noThrow: true },
  });
}

export function withPagination<T extends SQLiteSelect>(
  qb: T,
  page: number = 1,
  pageSize: number = 10,
) {
  return qb.limit(pageSize).offset((page - 1) * pageSize);
}
