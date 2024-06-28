import { Injectable } from '@nestjs/common';
import { DBService } from '/@/db/db.service';
import {
  ExtensionAuthTokenInsertPayload,
  ExtensionAuthTokenUpdatePayload,
} from './extension-auth-token.interface';
import { safeStorage } from 'electron';
import { DATABASE_CHANGES_ALL_ARGS } from '#packages/common/utils/constant/constant';
import {
  SelectextensionCredentialOauthTokens,
  extensionCredOauthTokens,
} from '/@/db/schema/extension.schema';
import { eq } from 'drizzle-orm';

function decryptToken({
  accessToken,
  refreshToken,
}: Pick<SelectextensionCredentialOauthTokens, 'accessToken' | 'refreshToken'>) {
  return {
    accessToken: safeStorage.decryptString(accessToken),
    refreshToken: refreshToken && safeStorage.decryptString(refreshToken),
  };
}

@Injectable()
export class ExtensionAuthTokenService {
  constructor(private dbService: DBService) {}

  async insertToken({
    scope,
    tokenType,
    accessToken,
    credentialId,
    refreshToken,
    expiresTimestamp,
  }: ExtensionAuthTokenInsertPayload) {
    const encryptedAccessToken = safeStorage.encryptString(accessToken);
    const encryptedRefreshToken = refreshToken
      ? safeStorage.encryptString(refreshToken)
      : null;
    const result = await this.dbService.db
      .insert(extensionCredOauthTokens)
      .values({
        scope,
        tokenType,
        credentialId,
        expiresTimestamp,
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      })
      .returning();

    this.dbService.emitChanges({
      'database:get-extension-credential-list': [DATABASE_CHANGES_ALL_ARGS],
      'database:get-extension-credential-list-detail': [
        DATABASE_CHANGES_ALL_ARGS,
      ],
    });

    return result;
  }

  async updateToken(
    id: number,
    {
      scope,
      tokenType,
      accessToken,
      credentialId,
      refreshToken,
      expiresTimestamp,
    }: ExtensionAuthTokenUpdatePayload,
  ) {
    const encryptedAccessToken = accessToken
      ? safeStorage.encryptString(accessToken)
      : undefined;
    const encryptedRefreshToken = refreshToken
      ? safeStorage.encryptString(refreshToken)
      : undefined;
    const result = await this.dbService.db
      .update(extensionCredOauthTokens)
      .set({
        scope,
        tokenType,
        credentialId,
        expiresTimestamp,
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(extensionCredOauthTokens.id, id))
      .returning();

    this.dbService.emitChanges({
      'database:get-extension-credential-list': [DATABASE_CHANGES_ALL_ARGS],
      'database:get-extension-credential-list-detail': [
        DATABASE_CHANGES_ALL_ARGS,
      ],
    });

    return result;
  }

  async getToken(id: number) {
    const queryResult =
      await this.dbService.db.query.extensionCredOauthTokens.findFirst({
        columns: {
          id: true,
          scope: true,
          accessToken: true,
          refreshToken: true,
          credentialId: true,
          expiresTimestamp: true,
        },
        where(fields, operators) {
          return operators.eq(fields.id, id);
        },
      });
    if (!queryResult) return null;

    return {
      ...queryResult,
      ...decryptToken(queryResult),
    };
  }

  async getTokenByCredential(
    credentialId: string | { extensionId: string; providerId: string },
  ) {
    const result = await this.dbService.db.query.extensionCreds.findFirst({
      columns: {
        id: true,
      },
      with: {
        oauthToken: {},
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
    if (!result || !result.oauthToken) return null;

    return {
      ...result.oauthToken,
      ...decryptToken(result.oauthToken),
    };
  }

  async deleteTokenByCredential(
    credentialId: string | { extensionId: string; providerId: string },
  ) {
    const token = await this.getTokenByCredential(credentialId);
    if (!token) return null;

    await this.dbService.db
      .delete(extensionCredOauthTokens)
      .where(eq(extensionCredOauthTokens, token.id));

    return token;
  }
}
