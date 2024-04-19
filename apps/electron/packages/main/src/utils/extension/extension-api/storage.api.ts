import extensionsDB from '../../../db/extension.db';
import { safeStorage } from 'electron';
import { storages } from '/@/db/schema/extension.schema';
import { parseJSON } from '@repo/shared';
import type ExtensionAPI from '@repo/extension-core/types/extension-api';
import { and, eq, inArray } from 'drizzle-orm';
import DatabaseService from '/@/services/database.service';
import ExtensionIPCEvent from '../ExtensionIPCEvent';

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
    const result = await DatabaseService.getStorage(keys, extensionId);
    if (!result) return {};

    return { [keys]: decryptStorageValue(result.value) };
  }

  const queryResult = await DatabaseService.getStorage(keys, extensionId);
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

    await extensionsDB.insert(storages).values({
      key,
      value: encryptedValue,
      extensionId: extensionId,
    });
  },
);

ExtensionIPCEvent.instance.on(
  'storage.remove',
  async ({ extensionId }, key) => {
    await extensionsDB
      .delete(storages)
      .where(
        and(
          eq(storages.extensionId, extensionId),
          Array.isArray(key)
            ? inArray(storages.key, key)
            : eq(storages.key, key),
        ),
      );
  },
);

ExtensionIPCEvent.instance.on('storage.getAll', async ({ extensionId }) => {
  const queryResult = await DatabaseService.getAllExtensionStorage(extensionId);
  const result = queryResult.reduce<ResultType>((acc, { key, value }) => {
    acc[key] = decryptStorageValue(value);

    return acc;
  }, {});

  return result;
});

ExtensionIPCEvent.instance.on('storage.clear', async ({ extensionId }) => {
  await extensionsDB
    .delete(storages)
    .where(eq(storages.extensionId, extensionId));
});
