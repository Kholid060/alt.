import { onExtensionIPCEvent } from '../extension-api-event';
import extensionsDB from '../../../db/extension.db';
import { safeStorage } from 'electron';
import { storages } from '/@/db/schema/extension.schema';
import { parseJSON } from '@repo/shared';
import type ExtensionAPI from '@repo/extension-core/types/extension-api';
import { and, eq, inArray } from 'drizzle-orm';
import ExtensionsDBController from '/@/db/controller/extensions-db.controller';

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

onExtensionIPCEvent('storage.get', async ({ extension }, keys) => {
  if (typeof keys === 'string') {
    const result = await ExtensionsDBController.getStorage(keys, extension.id);
    if (!result) return {};

    return { [keys]: decryptStorageValue(result.value) };
  }

  const queryResult = await ExtensionsDBController.getStorage(
    keys,
    extension.id,
  );
  const result = queryResult.reduce<ResultType>((acc, { key, value }) => {
    acc[key] = decryptStorageValue(value);

    return acc;
  }, {});

  return result;
});

onExtensionIPCEvent('storage.set', async ({ extension }, key, value) => {
  const encryptedValue = safeStorage.encryptString(
    typeof value === 'string' ? value : JSON.stringify(value),
  );

  await extensionsDB.insert(storages).values({
    key,
    value: encryptedValue,
    extensionId: extension.id,
  });
});

onExtensionIPCEvent('storage.remove', async ({ extension }, key) => {
  await extensionsDB
    .delete(storages)
    .where(
      and(
        eq(storages.extensionId, extension.id),
        Array.isArray(key) ? inArray(storages.key, key) : eq(storages.key, key),
      ),
    );
});

onExtensionIPCEvent('storage.getAll', async ({ extension }) => {
  const queryResult = await ExtensionsDBController.getAllExtensionStorage(
    extension.id,
  );
  const result = queryResult.reduce<ResultType>((acc, { key, value }) => {
    acc[key] = decryptStorageValue(value);

    return acc;
  }, {});

  return result;
});

onExtensionIPCEvent('storage.clear', async ({ extension }) => {
  await extensionsDB
    .delete(storages)
    .where(eq(storages.extensionId, extension.id));
});
