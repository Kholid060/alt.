import { Injectable } from '@nestjs/common';
import { DBService } from '/@/db/db.service';
import { parseJSON } from '@alt-dot/shared';
import ExtensionAPI from '@alt-dot/extension-core/types/extension-api';
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
  const decryptedValue = safeStorage.decryptString(value);

  return {
    value:
      (parseJSON(
        decryptedValue,
        decryptedValue,
      ) as ExtensionAPI.storage.Values) ?? null,
    ...rest,
  };
};

@Injectable()
export class ExtensionStorageService {
  constructor(private dbService: DBService) {}

  async listItemsByExtensionId(extensionId: string, keys?: string[]) {
    const result = await this.dbService.db.query.extensionStorages.findMany({
      columns: {
        key: true,
        value: true,
      },
      where(fields, { eq, inArray, and }) {
        if (keys) {
          return and(
            eq(fields.extensionId, extensionId),
            inArray(fields.key, keys),
          );
        }
        return eq(fields.extensionId, extensionId);
      },
    });

    return result.map(mapStorageValue);
  }

  upsertItems(extensionId: string, values: Record<string, unknown>) {
    const records = Object.entries(values).reduce<NewExtensionStorage[]>(
      (acc, [key, value]) => {
        acc.push({
          key,
          extensionId,
          id: `${extensionId}:${key}`,
          updatedAt: new Date().toISOString(),
          value: safeStorage.encryptString(
            typeof value === 'string' ? value : JSON.stringify(value),
          ),
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

  deleteItemsByExtensionId(extensionId: string, keys?: string[]) {
    return this.dbService.db
      .delete(extensionStorages)
      .where(
        keys
          ? and(
              eq(extensionStorages.extensionId, extensionId),
              inArray(extensionStorages.key, keys),
            )
          : eq(extensionStorages.extensionId, extensionId),
      );
  }
}
