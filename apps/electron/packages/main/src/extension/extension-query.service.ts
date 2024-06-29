import { DATABASE_CHANGES_ALL_ARGS } from '#packages/common/utils/constant/constant';
import { EXTENSION_BUILT_IN_ID } from '#packages/common/utils/constant/extension.const';
import { ExtensionManifest } from '@alt-dot/extension-core';
import { Injectable } from '@nestjs/common';
import { eq, sql, SQL } from 'drizzle-orm';
import { DBService } from '../db/db.service';
import { extensionErrors, extensions } from '../db/schema/extension.schema';
import {
  ExtensionUpdatePayload,
  ExtensionListFilterPayload,
  ExtensionListItemModel,
  ExtensionWithCredListItemModel,
} from './extension.interface';

@Injectable()
export class ExtensionQueryService {
  constructor(private dbService: DBService) {}

  async get(extensionId: string) {
    const extension = await this.dbService.db.query.extensions.findFirst({
      with: { commands: {} },
      where(fields, operators) {
        return operators.eq(fields.id, extensionId);
      },
    });

    return extension ?? null;
  }

  exists(extensionId: string): Promise<boolean> {
    return this.dbService.db.query.extensions
      .findFirst({
        columns: { id: true },
        where(fields, operators) {
          return operators.eq(fields.id, extensionId);
        },
      })
      .then((result) => Boolean(result));
  }

  async update(extensionId: string, value: ExtensionUpdatePayload) {
    const result = await this.dbService.db
      .update(extensions)
      .set(value)
      .where(eq(extensions.id, extensionId))
      .returning();

    this.dbService.emitChanges({
      'database:get-extension': [extensionId],
      'database:get-extension-list': [DATABASE_CHANGES_ALL_ARGS],
    });

    return result;
  }

  list(
    filter: ExtensionListFilterPayload = {},
  ): Promise<ExtensionListItemModel[]> {
    return this.dbService.db.query.extensions.findMany({
      columns: {
        id: true,
        path: true,
        icon: true,
        title: true,
        config: true,
        version: true,
        isError: true,
        isLocal: true,
        updatedAt: true,
        isDisabled: true,
        description: true,
        errorMessage: true,
      },
      with: {
        commands: {},
      },
      extras: {
        errorsCount:
          sql<number>`(SELECT COUNT(*) FROM ${extensionErrors} WHERE ${extensionErrors.extensionId} = extensions.id)`.as(
            'errors_count',
          ),
      },
      where: (fields, operators) => {
        const filters: SQL<unknown>[] = [];

        if (filter?.activeOnly) {
          filters.push(
            operators.eq(fields.isDisabled, false),
            operators.eq(fields.isError, false),
          );
        }
        if (filter?.excludeBuiltIn) {
          filters.push(
            operators.notInArray(
              fields.id,
              Object.values(EXTENSION_BUILT_IN_ID),
            ),
          );
        }

        if (filters.length === 0) return;

        return operators.and(...filters);
      },
    });
  }

  listCredentials(): Promise<ExtensionWithCredListItemModel[]> {
    return this.dbService.db.query.extensions.findMany({
      columns: {
        id: true,
        title: true,
        credentials: true,
      },
      where(fields, operators) {
        return operators.isNotNull(fields.credentials);
      },
    });
  }

  async getManifest(extensionId: string): Promise<ExtensionManifest | null> {
    const extension = await this.dbService.db.query.extensions.findFirst({
      where(fields, operators) {
        return operators.and(
          operators.eq(fields.isError, false),
          operators.eq(fields.id, extensionId),
          operators.eq(fields.isDisabled, false),
        );
      },
      with: {
        commands: {},
      },
    });
    if (!extension) return null;

    return {
      ...extension,
      categories: [],
      $apiVersion: '',
    } as ExtensionManifest;
  }
}
