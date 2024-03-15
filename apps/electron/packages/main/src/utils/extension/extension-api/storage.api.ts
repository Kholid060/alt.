import { onExtensionIPCEvent } from '../extension-api-event';
import extensionsDB from '../../../db/extension.db';
import { safeStorage } from 'electron';
import { extensionsStorage } from '/@/db/schema/extension.schema';
import { parseJSON } from '@repo/shared';
import type ExtensionAPI from '@repo/extension-core/types/extension-api';
import { and, eq, inArray } from 'drizzle-orm';

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
    const result = await extensionsDB.query.extensionsStorage.findFirst({
      columns: {
        value: true,
      },
      where: (fields, { eq, and }) =>
        and(eq(fields.extensionId, extension.id), eq(fields.key, keys)),
    });
    if (!result) return null as unknown as ResultType;

    return decryptStorageValue(result.value) as unknown as ResultType;
  }

  const queryResult = await extensionsDB.query.extensionsStorage.findMany({
    columns: {
      key: true,
      value: true,
    },
    where: (fields, { inArray, and, eq }) =>
      and(eq(fields.extensionId, extension.id), inArray(fields.key, keys)),
  });
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

  await extensionsDB.insert(extensionsStorage).values({
    key,
    value: encryptedValue,
    extensionId: extension.id,
  });
});

onExtensionIPCEvent('storage.remove', async ({ extension }, key) => {
  await extensionsDB
    .delete(extensionsStorage)
    .where(
      and(
        eq(extensionsStorage.extensionId, extension.id),
        Array.isArray(key)
          ? inArray(extensionsStorage.key, key)
          : eq(extensionsStorage.key, key),
      ),
    );
});

onExtensionIPCEvent('storage.getAll', async ({ extension }) => {
  const queryResult = await extensionsDB.query.extensionsStorage.findMany({
    columns: {
      key: true,
      value: true,
    },
    where(fields, { eq }) {
      return eq(fields.extensionId, extension.id);
    },
  });
  const result = queryResult.reduce<ResultType>((acc, { key, value }) => {
    acc[key] = decryptStorageValue(value);

    return acc;
  }, {});

  return result;
});

onExtensionIPCEvent('storage.clear', async ({ extension }) => {
  await extensionsDB
    .delete(extensionsStorage)
    .where(eq(extensionsStorage.extensionId, extension.id));
});
