import type { ExtensionCommand, ExtensionManifest } from '@repo/extension-core';
import type { SQL } from 'drizzle-orm';
import { getTableColumns, sql } from 'drizzle-orm';
import type { SQLiteTable } from 'drizzle-orm/sqlite-core';
import type {
  NewExtension,
  NewExtensionCommand,
} from '../db/schema/extension.schema';

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
