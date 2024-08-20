import { ExtensionAPI } from '@altdot/extension';
import { SelectExtensionOauthToken } from '/@/db/schema/extension.schema';
import { safeStorage } from 'electron';

function decryptIfBuffer(value: string | Buffer) {
  return Buffer.isBuffer(value) ? safeStorage.decryptString(value) : value;
}

export function tokenDbToStorageValue(
  token: Pick<SelectExtensionOauthToken, 'scope' | 'expiresTimestamp'> & {
    accessToken: string | Buffer;
    refreshToken?: string | Buffer | null;
  },
): ExtensionAPI.OAuth.OAuthTokenStorageValue {
  return {
    scope: token.scope ?? undefined,
    refreshToken: token.refreshToken
      ? decryptIfBuffer(token.refreshToken)
      : undefined,
    accessToken: decryptIfBuffer(token.accessToken),
    expiresTimestamp: token.expiresTimestamp ?? 0,
    expiresIn: token.expiresTimestamp
      ? Math.max(
          0,
          new Date(token.expiresTimestamp).getTime() - new Date().getTime(),
        ) / 1000
      : 0,
  };
}
