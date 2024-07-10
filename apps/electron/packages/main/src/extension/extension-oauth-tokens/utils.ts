import { Operators } from 'drizzle-orm';
import { safeStorage } from 'electron';
import {
  extensionOAuthTokens,
  SelectExtensionOauthToken,
} from '/@/db/schema/extension.schema';
import { ExtensionOAuthTokenFindById } from './extension-oauth-tokens.interface';

export function findOAuthTokenByIdQuery(id: ExtensionOAuthTokenFindById) {
  return (
    fields: typeof extensionOAuthTokens._.columns,
    operators: Operators,
  ) => {
    if (typeof id === 'number') return operators.eq(fields.id, id);

    return operators.and(
      operators.eq(fields.key, id.key),
      operators.eq(fields.clientId, id.clientId),
      operators.eq(fields.extensionId, id.extensionId),
    );
  };
}

export function decryptOAuthValue({
  accessToken,
  refreshToken,
}: Pick<SelectExtensionOauthToken, 'accessToken' | 'refreshToken'>) {
  return {
    accessToken: safeStorage.decryptString(accessToken),
    refreshToken: refreshToken
      ? safeStorage.decryptString(refreshToken)
      : undefined,
  };
}

export function encryptOAuthValue({
  accessToken,
  refreshToken,
}: {
  accessToken: string;
  refreshToken?: string;
}): { accessToken: Buffer; refreshToken?: Buffer };
export function encryptOAuthValue({
  accessToken,
  refreshToken,
}: {
  accessToken?: string;
  refreshToken?: string;
}): { accessToken?: Buffer; refreshToken?: Buffer };
export function encryptOAuthValue({
  accessToken,
  refreshToken,
}: {
  accessToken?: string;
  refreshToken?: string;
}): { accessToken?: Buffer; refreshToken?: Buffer } {
  return {
    accessToken: accessToken
      ? safeStorage.encryptString(accessToken)
      : undefined,
    refreshToken: refreshToken
      ? safeStorage.encryptString(refreshToken)
      : undefined,
  };
}
