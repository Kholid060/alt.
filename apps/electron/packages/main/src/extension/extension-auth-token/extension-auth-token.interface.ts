import { NewExtensionCredentialOauthTokens } from '/@/db/schema/extension.schema';

export type ExtensionAuthTokenUpdatePayload = Partial<
  Omit<
    NewExtensionCredentialOauthTokens,
    'id' | 'createdAt' | 'updatedAt' | 'accessToken' | 'refreshToken'
  > & { refreshToken: string; accessToken: string }
>;

export type ExtensionAuthTokenInsertPayload = Omit<
  NewExtensionCredentialOauthTokens,
  'id' | 'createdAt' | 'updatedAt' | 'refreshToken' | 'accessToken'
> & { refreshToken?: string; accessToken: string };
