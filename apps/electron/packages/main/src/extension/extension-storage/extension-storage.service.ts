import { Injectable } from '@nestjs/common';
import { DBService } from '/@/db/db.service';
import { parseJSON } from '@altdot/shared';
import { ExtensionAPI } from '@altdot/extension';
import { safeStorage } from 'electron';
import {
  NewExtensionStorage,
  SelectExtensionStorage,
  extensionStorages,
} from '/@/db/schema/extension.schema';
import { SetRequired } from 'type-fest';
import { conflictUpdateAllExcept } from '/@/common/utils/database-utils';
import { and, eq, inArray } from 'drizzle-orm';

const mapStorageValue = <
  T extends SetRequired<Partial<SelectExtensionStorage>, 'value'>,
>({
  value,
  ...rest
}: T) => {
  const decryptedValue = rest.isSecure
    ? safeStorage.decryptString(value)
    : value.toString();

  return {
    value:
      (parseJSON(
        decryptedValue,
        decryptedValue,
      ) as ExtensionAPI.Storage.Values) ?? null,
    ...rest,
  };
};

@Injectable()
export class ExtensionStorageService {
  constructor(private dbService: DBService) {}

  async listItemsByExtensionId({
    keys,
    isSecure,
    extensionId,
  }: {
    keys?: string[];
    isSecure?: boolean;
    extensionId: string;
  }) {
    const result = await this.dbService.db.query.extensionStorages.findMany({
      columns: {
        key: true,
        value: true,
        isSecure: true,
      },
      where(fields, { eq, inArray, and }) {
        if (keys) {
          return and(
            eq(fields.extensionId, extensionId),
            inArray(fields.key, keys),
            typeof isSecure === 'boolean'
              ? eq(fields.isSecure, isSecure)
              : undefined,
          );
        }

        return typeof isSecure === 'boolean'
          ? and(
              eq(fields.extensionId, extensionId),
              eq(fields.isSecure, isSecure),
            )
          : eq(fields.extensionId, extensionId);
      },
    });

    return result.map(mapStorageValue);
  }

  upsertItems({
    values,
    isSecure,
    extensionId,
  }: {
    isSecure?: boolean;
    extensionId: string;
    values: Record<string, unknown>;
  }) {
    const records = Object.entries(values).reduce<NewExtensionStorage[]>(
      (acc, [key, value]) => {
        acc.push({
          key,
          isSecure,
          extensionId,
          updatedAt: new Date().toISOString(),
          id: `${extensionId}:${key}${isSecure ? '$' : ''}`,
          value: isSecure
            ? safeStorage.encryptString(
                typeof value === 'string' ? value : JSON.stringify(value),
              )
            : Buffer.from(JSON.stringify(value)),
        });

        return acc;
      },
      [],
    );

    return this.dbService.db
      .insert(extensionStorages)
      .values(records)
      .onConflictDoUpdate({
        target: extensionStorages.id,
        set: conflictUpdateAllExcept(extensionStorages, [
          'id',
          'key',
          'createdAt',
          'updatedAt',
        ]),
      })
      .returning();
  }

  deleteItemsByExtensionId({
    keys,
    isSecure,
    extensionId,
  }: {
    isSecure?: boolean;
    extensionId: string;
    keys?: string | string[];
  }) {
    return this.dbService.db
      .delete(extensionStorages)
      .where(
        keys
          ? and(
              eq(extensionStorages.extensionId, extensionId),
              Array.isArray(keys)
                ? inArray(extensionStorages.key, keys)
                : eq(extensionStorages.key, keys),
              typeof isSecure === 'boolean'
                ? eq(extensionStorages.isSecure, isSecure)
                : undefined,
            )
          : typeof isSecure === 'boolean'
            ? and(
                eq(extensionStorages.extensionId, extensionId),
                eq(extensionStorages.isSecure, isSecure),
              )
            : eq(extensionStorages.extensionId, extensionId),
      );
  }
}
