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
    args: [query, params, options],
  }: ExtensionApiEvent<'sqlite.query'>) {
    const result = this.extensionSqlite.query(extensionId, {
      query,
      params,
      dbPath: options?.dbPath,
      selectAll: options?.selectAll,
    });

    return Promise.resolve(result);
  }
}
