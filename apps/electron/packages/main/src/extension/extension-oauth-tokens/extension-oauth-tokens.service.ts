import { Injectable } from '@nestjs/common';
import { DBService } from '/@/db/db.service';
import { extensionOAuthTokens } from '/@/db/schema/extension.schema';
import { getOperators } from 'drizzle-orm';
import {
  ExtensionOAuthTokenFindById,
  ExtensionOAuthTokenInsertPayload,
  ExtensionOAuthTokenModel,
  ExtensionOAuthTokensListItemModel,
  ExtensionOAuthTokenUpdatePayload,
} from './extension-oauth-tokens.interface';
import {
  decryptOAuthValue,
  encryptOAuthValue,
  findOAuthTokenByIdQuery,
} from './utils';

@Injectable()
export class ExtensionOAuthTokensService {
  constructor(private dbService: DBService) {}

  async get(
    id: ExtensionOAuthTokenFindById,
  ): Promise<ExtensionOAuthTokenModel | null> {
    const value = await this.dbService.db.query.extensionOAuthTokens.findFirst({
      where: findOAuthTokenByIdQuery(id),
    });
    if (!value) return null;

    return { ...value, ...decryptOAuthValue(value) };
  }

  async remove(id: ExtensionOAuthTokenFindById) {
    const result = await this.dbService.db
      .delete(extensionOAuthTokens)
      .where(findOAuthTokenByIdQuery(id)(extensionOAuthTokens, getOperators()))
      .returning();

    this.dbService.emitChanges({
      'database:get-oauth-tokens-account-list': [],
    });

    return result;
  }

  async upsert(
    id: ExtensionOAuthTokenFindById,
    payload: ExtensionOAuthTokenInsertPayload,
  ) {
    const value = await this.dbService.db.query.extensionOAuthTokens.findFirst({
      columns: { id: true },
      where: findOAuthTokenByIdQuery(id),
    });
    if (value) return this.update(value.id, payload);

    return this.insert(payload);
  }

  update(
    id: ExtensionOAuthTokenFindById,
    {
      scope,
      clientId,
      tokenType,
      extensionId,
      accessToken,
      refreshToken,
      expiresTimestamp,
    }: ExtensionOAuthTokenUpdatePayload,
  ) {
    return this.dbService.db
      .update(extensionOAuthTokens)
      .set({
        scope,
        clientId,
        tokenType,
        extensionId,
        expiresTimestamp,
        updatedAt: new Date().toISOString(),
        ...encryptOAuthValue({ accessToken, refreshToken }),
      })
      .where(findOAuthTokenByIdQuery(id)(extensionOAuthTokens, getOperators()))
      .returning();
  }

  async insert({
    key,
    scope,
    clientId,
    extensionId,
    accessToken,
    refreshToken,
    providerIcon,
    providerName,
    expiresTimestamp,
  }: ExtensionOAuthTokenInsertPayload) {
    const result = await this.dbService.db
      .insert(extensionOAuthTokens)
      .values({
        key,
        scope,
        clientId,
        extensionId,
        providerIcon,
        providerName,
        expiresTimestamp,
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        ...encryptOAuthValue({ accessToken, refreshToken }),
      })
      .returning();

    this.dbService.emitChanges({
      'database:get-oauth-tokens-account-list': [],
    });

    return result;
  }

  listAccounts(): Promise<ExtensionOAuthTokensListItemModel[]> {
    return this.dbService.db.query.extensionOAuthTokens.findMany({
      columns: {
        id: true,
        createdAt: true,
        updatedAt: true,
        extensionId: true,
        providerIcon: true,
        providerName: true,
      },
      with: {
        extension: {
          columns: { title: true },
        },
      },
    });
  }
}
