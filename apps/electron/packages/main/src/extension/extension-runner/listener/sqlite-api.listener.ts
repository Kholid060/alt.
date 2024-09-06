import { Injectable } from '@nestjs/common';
import { ExtensionSqliteService } from '../../extension-sqlite/extension-sqlite.service';
import { OnExtensionAPI } from '/@/common/decorators/extension.decorator';
import { ExtensionApiEvent } from '../events/extension-api.event';

@Injectable()
export class ExtensionSqliteApiListener {
  constructor(private extensionSqlite: ExtensionSqliteService) {}

  @OnExtensionAPI('sqlite.query')
  query({
    context: { extensionId },
    args: [{ params, sql, dbPath, method }],
  }: ExtensionApiEvent<'sqlite.query'>) {
    const result = this.extensionSqlite.query(extensionId, {
      params,
      dbPath,
      method,
      query: sql,
    });

    return Promise.resolve(result);
  }

  @OnExtensionAPI('sqlite.execute')
  execute({
    context: { extensionId },
    args: [{ sql, dbPath }],
  }: ExtensionApiEvent<'sqlite.execute'>) {
    this.extensionSqlite.execute(extensionId, sql, dbPath);
    return Promise.resolve();
  }

  @OnExtensionAPI('sqlite.openDb')
  openDB({
    context: { extensionId },
    args: [dbPath],
  }: ExtensionApiEvent<'sqlite.openDb'>) {
    if (!dbPath) return Promise.reject('Missing DB Path');

    this.extensionSqlite.openDatabase(extensionId, dbPath);

    return Promise.resolve();
  }

  @OnExtensionAPI('sqlite.closeDb')
  closeDB({
    context: { extensionId },
    args: [dbPath],
  }: ExtensionApiEvent<'sqlite.closeDb'>) {
    this.extensionSqlite.closeDB(extensionId, dbPath);
    return Promise.resolve();
  }
}
