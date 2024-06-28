import { Injectable } from '@nestjs/common';
import { DBService } from '/@/db/db.service';
import { ExtensionErrorListItemModel } from './extension-error.interface';
import { extensionErrors } from '/@/db/schema/extension.schema';
import { inArray } from 'drizzle-orm';
import { DATABASE_CHANGES_ALL_ARGS } from '#packages/common/utils/constant/constant';

@Injectable()
export class ExtensionErrorService {
  constructor(private dbService: DBService) {}

  listErrorsByExtension(
    extensionId: string,
  ): Promise<ExtensionErrorListItemModel[]> {
    return this.dbService.db.query.extensionErrors.findMany({
      where(fields, operators) {
        return operators.eq(fields.extensionId, extensionId);
      },
      orderBy(fields, operators) {
        return operators.desc(fields.createdAt);
      },
    });
  }

  async deleteErrors(ids: number[]) {
    const result = await this.dbService.db
      .delete(extensionErrors)
      .where(inArray(extensionErrors.id, ids))
      .returning();

    this.dbService.emitChanges({
      'database:get-extension-list': [DATABASE_CHANGES_ALL_ARGS],
      'database:get-extension-errors-list': [DATABASE_CHANGES_ALL_ARGS],
    });

    return result;
  }
}
