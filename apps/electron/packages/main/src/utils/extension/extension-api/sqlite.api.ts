import ExtensionSqlite from '../ExtensionSqlite';
import { onExtensionIPCEvent } from '../extension-api-event';

onExtensionIPCEvent(
  'sqlite.query',
  ({ extensionId }, query, params, options) => {
    const result = ExtensionSqlite.instance.query(extensionId, {
      query,
      params,
      selectAll: options?.selectAll,
    });

    return Promise.resolve(result);
  },
);
