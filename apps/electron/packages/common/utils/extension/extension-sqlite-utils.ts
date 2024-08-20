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
