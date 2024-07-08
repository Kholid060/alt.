import { Injectable } from '@nestjs/common';
import { DBService } from '/@/db/db.service';
import {
  extensionCredOauthTokens,
  extensionCreds,
  extensions,
} from '/@/db/schema/extension.schema';
import {
  ExtensionCredentialInsertPayload,
  ExtensionCredentialUpdatePayload,
  ExtensionCredentialListPaginationModel,
  ExtensionListPaginationPayload,
  ExtensionCredentialListPaginationItemModel,
  ExtensionCredentialDetailModel,
} from './extension-credential.interface';
import { asc, count, desc, eq, like } from 'drizzle-orm';
import { safeStorage } from 'electron';
import { DATABASE_CHANGES_ALL_ARGS } from '#packages/common/utils/constant/constant';
import { nanoid } from 'nanoid';
import { SQLiteColumn } from 'drizzle-orm/sqlite-core';
import { withPagination } from '/@/common/utils/database-utils';
import { parseJSON } from '@altdot/shared';

@Injectable()
export class ExtensionCredentialService {
  constructor(private dbService: DBService) {}

  async updateCredential(
    id: string,
    { name, value }: ExtensionCredentialUpdatePayload,
  ) {
    const updatedValue = value;
    if (updatedValue) {
      Object.keys(value).forEach((key) => {
        if (key.startsWith('__MASK_VALUE__')) {
          delete updatedValue[key];
        }
      });
    }

    const encryptedValue = updatedValue
      ? safeStorage.encryptString(JSON.stringify(updatedValue))
      : undefined;
    const result = await this.dbService.db
      .update(extensionCreds)
      .set({
        name,
        value: encryptedValue,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(extensionCreds.id, id))
      .returning();

    this.dbService.emitChanges({
      'database:get-extension-credential-list-detail': [id],
      'database:get-extension-credential-list': [DATABASE_CHANGES_ALL_ARGS],
    });

    return result;
  }

  async insertCredential({
    name,
    type,
    value,
    providerId,
    extensionId,
  }: ExtensionCredentialInsertPayload) {
    const id = nanoid();
    const encryptedValue = safeStorage.encryptString(JSON.stringify(value));

    const result = await this.dbService.db
      .insert(extensionCreds)
      .values({
        id,
        name,
        type,
        providerId,
        extensionId,
        value: encryptedValue,
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      })
      .returning();

    this.dbService.emitChanges({
      'database:get-extension-credential-list': [DATABASE_CHANGES_ALL_ARGS],
    });

    return result;
  }

  async listCredentialPagination({
    sort,
    filter,
    pagination,
  }: ExtensionListPaginationPayload = {}): Promise<ExtensionCredentialListPaginationModel> {
    let query = this.dbService.db
      .select({
        id: extensionCreds.id,
        name: extensionCreds.name,
        type: extensionCreds.type,
        updatedAt: extensionCreds.updatedAt,
        createdAt: extensionCreds.createdAt,
        providerId: extensionCreds.providerId,
        extension: {
          id: extensions.id,
          title: extensions.title,
        },
        tokenId: extensionCredOauthTokens.id,
      })
      .from(extensionCreds)
      .leftJoin(extensions, eq(extensions.id, extensionCreds.extensionId))
      .leftJoin(
        extensionCredOauthTokens,
        eq(extensionCredOauthTokens.credentialId, extensionCreds.id),
      )
      .$dynamic();

    if (filter?.extensionId) {
      query = query.where(eq(extensionCreds.extensionId, filter.extensionId));
    }
    if (filter?.name) {
      query = query.where(like(extensionCreds.name, `%${filter.name}%`));
    }

    if (sort) {
      let sortColumn: SQLiteColumn = extensionCreds.createdAt;
      switch (sort.by) {
        case 'updatedAt':
          sortColumn = extensionCreds.updatedAt;
          break;
        case 'name':
          sortColumn = extensionCreds.name;
          break;
      }

      query = query.orderBy(sort.asc ? asc(sortColumn) : desc(sortColumn));
    }
    if (pagination) {
      query = withPagination(query, pagination.page, pagination.pageSize);
    }

    const items = await query.execute();
    const itemsLength = filter
      ? items.length
      : (
          await this.dbService.db
            .select({ count: count() })
            .from(extensionCreds)
        )[0].count;

    return {
      count: itemsLength,
      items: items as ExtensionCredentialListPaginationItemModel[],
    };
  }

  async deleteCredential(id: string) {
    const deletedCredential = await this.dbService.db
      .delete(extensionCreds)
      .where(eq(extensionCreds.id, id))
      .returning();

    this.dbService.emitChanges({
      'database:get-extension-credential-list-detail': [id],
      'database:get-extension-credential-list': [DATABASE_CHANGES_ALL_ARGS],
    });

    return deletedCredential;
  }

  async getCredentialDetail(
    credentialId: string | { extensionId: string; providerId: string },
    maskSecret?: boolean,
  ): Promise<ExtensionCredentialDetailModel | null> {
    const result = await this.dbService.db.query.extensionCreds.findFirst({
      with: {
        extension: {
          columns: {
            id: true,
            title: true,
            credentials: true,
          },
        },
        oauthToken: {
          columns: {
            id: true,
            expiresTimestamp: true,
          },
        },
      },
      where(fields, operators) {
        if (typeof credentialId === 'string') {
          return operators.eq(fields.id, credentialId);
        }

        return operators.and(
          operators.eq(fields.extensionId, credentialId.extensionId),
          operators.eq(fields.providerId, credentialId.providerId),
        );
      },
    });
    if (!result) return null;

    const finalResult = {
      ...result,
      value: parseJSON<Record<string, string>, Record<string, string>>(
        safeStorage.decryptString(result.value),
        {},
      ),
    };
    if (!maskSecret) return finalResult;

    switch (finalResult.type) {
      case 'oauth2':
        finalResult.value.clientSecret = `__MASK_VALUE__${result.id}`;
        break;
    }

    return finalResult;
  }
}
