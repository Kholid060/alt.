import ExtensionSqlite from '../ExtensionSqlite';
import { onExtensionIPCEvent } from '../extension-api-event';

onExtensionIPCEvent('sqlite.query', ({ extension }, query, params, options) => {
  const result = ExtensionSqlite.instance.query(extension.id, {
    query,
    params,
    selectAll: options?.selectAll,
  });

  return Promise.resolve(result);
});
