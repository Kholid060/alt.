import {
  NewExtensionOauthToken,
  SelectExtension,
  SelectExtensionOauthToken,
} from '../../db/schema/extension.schema';

export interface ExtensionOAuthTokenValue
  extends Omit<
    NewExtensionOauthToken,
    'refreshToken' | 'accessToken' | 'createdAt' | 'updatedAt' | 'id'
  > {
  accessToken: string;
  refreshToken?: string;
}

export interface ExtensionOAuthTokenModel
  extends Omit<
    SelectExtensionOauthToken,
    'refreshToken' | 'accessToken' | 'createdAt' | 'updatedAt' | 'id'
  > {
  accessToken: string;
  refreshToken?: string;
}

export type ExtensionOAuthTokenInsertPayload = ExtensionOAuthTokenValue & {
  extensionId: string;
  clientId: string;
};

export type ExtensionOAuthTokenUpdatePayload =
  Partial<ExtensionOAuthTokenInsertPayload>;

export type ExtensionOAuthTokenFindById =
  | number
  | { clientId: string; extensionId: string; key: string };

export type ExtensionOAuthTokensListItemModel = Pick<
  SelectExtensionOauthToken,
  | 'id'
  | 'providerIcon'
  | 'providerName'
  | 'createdAt'
  | 'updatedAt'
  | 'extensionId'
> & { extension: Pick<SelectExtension, 'title'> };
