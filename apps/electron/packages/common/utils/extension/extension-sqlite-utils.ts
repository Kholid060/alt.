import { ExtensionAPI } from '@altdot/extension';
import { CreateExtensionAPI } from './extension-api-factory';

export function createSqliteStatement<T = unknown>(
  sql: string,
  {
    dbPath,
    sendMessage,
  }: { sendMessage: CreateExtensionAPI['sendMessage']; dbPath?: string },
): ExtensionAPI.Sqlite.Statement {
  return {
    all<P = T>(...params: unknown[]) {
      return sendMessage('sqlite.query', {
        sql,
        params,
        dbPath,
        method: 'all',
      }) as Promise<P[]>;
    },
    run(...params: unknown[]) {
      return sendMessage('sqlite.query', {
        sql,
        params,
        dbPath,
        method: 'run',
      }) as Promise<ExtensionAPI.Sqlite.DBRunResult>;
    },
    get<P = T>(...params: unknown[]) {
      return sendMessage('sqlite.query', {
        sql,
        params,
        dbPath,
        method: 'get',
      }) as Promise<P>;
    },
  };
}

export function createExtensionSqliteDB(
  options: ExtensionAPI.Sqlite.OpenOptions,
  sendMessage: CreateExtensionAPI['sendMessage'],
): ExtensionAPI.Sqlite.Database {
  if (!options?.path.trim()) throw new Error('Missing DB Path');

  let isClosed = false;
  const checkConnection = () => {
    if (isClosed) throw new Error('DB connection is already closed');
  };

  return {
    execute(sql) {
      checkConnection();
      return sendMessage('sqlite.execute', { sql, dbPath: options.path });
    },
    sql(sql) {
      checkConnection();
      return createSqliteStatement(sql, { sendMessage, dbPath: options.path });
    },
    async close() {
      await sendMessage('sqlite.closeDb', options.path);
      isClosed = true;
    },
  };
}
