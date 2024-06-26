import { safeStorage } from 'electron';
import { extensionStorages } from '/@/db/schema/extension.schema';
import { parseJSON } from '@alt-dot/shared';
import type ExtensionAPI from '@alt-dot/extension-core/types/extension-api';
import { and, eq, inArray } from 'drizzle-orm';
import ExtensionIPCEvent from '../ExtensionIPCEvent';
import DatabaseService from '/@/services/database/database.service';

const decryptStorageValue = (value: Buffer) => {
  const decryptedValue = safeStorage.decryptString(value);

  return (
    (parseJSON(
      decryptedValue,
      decryptedValue,
    ) as ExtensionAPI.storage.Values) ?? null
  );
};

type ResultType = Record<string, ExtensionAPI.storage.Values>;

ExtensionIPCEvent.instance.on('storage.get', async ({ extensionId }, keys) => {
  if (typeof keys === 'string') {
    const result = await DatabaseService.instance.extension.getStorage(
      keys,
      extensionId,
    );
    if (!result) return {};

    return { [keys]: decryptStorageValue(result.value) };
  }

  const queryResult = await DatabaseService.instance.extension.getStorage(
    keys,
    extensionId,
  );
  const result = queryResult.reduce<ResultType>((acc, { key, value }) => {
    acc[key] = decryptStorageValue(value);

    return acc;
  }, {});

  return result;
});

ExtensionIPCEvent.instance.on(
  'storage.set',
  async ({ extensionId }, key, value) => {
    const encryptedValue = safeStorage.encryptString(
      typeof value === 'string' ? value : JSON.stringify(value),
    );

    await DatabaseService.instance.db.insert(extensionStorages).values({
      key,
      value: encryptedValue,
      extensionId: extensionId,
    });
  },
);

ExtensionIPCEvent.instance.on(
  'storage.remove',
  async ({ extensionId }, key) => {
    await DatabaseService.instance.db
      .delete(extensionStorages)
      .where(
        and(
          eq(extensionStorages.extensionId, extensionId),
          Array.isArray(key)
            ? inArray(extensionStorages.key, key)
            : eq(extensionStorages.key, key),
        ),
      );
  },
);

ExtensionIPCEvent.instance.on('storage.getAll', async ({ extensionId }) => {
  const queryResult =
    await DatabaseService.instance.extension.storageList(extensionId);
  const result = queryResult.reduce<ResultType>((acc, { key, value }) => {
    acc[key] = decryptStorageValue(value);

    return acc;
  }, {});

  return result;
});

ExtensionIPCEvent.instance.on('storage.clear', async ({ extensionId }) => {
  await DatabaseService.instance.db
    .delete(extensionStorages)
    .where(eq(extensionStorages.extensionId, extensionId));
});
