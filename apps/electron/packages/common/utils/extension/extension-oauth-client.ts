import { ExtensionAPI } from '@altdot/extension';
import { CreateExtensionAPI } from './extension-api-factory';

export class OAuthPKCEClient implements ExtensionAPI.OAuth.OAuthPKCEClient {
  private readonly provider: ExtensionAPI.OAuth.OAuthProvider;
  private readonly sendMessage: CreateExtensionAPI['sendMessage'];

  constructor({
    provider,
    sendMessage,
  }: Pick<CreateExtensionAPI, 'sendMessage'> & {
    provider: ExtensionAPI.OAuth.OAuthProvider;
  }) {
    this.provider = provider;
    this.sendMessage = sendMessage;
  }

  getToken(): Promise<ExtensionAPI.OAuth.OAuthTokenStorageValue | null> {
    return this.sendMessage('oAuth.getToken', this.provider);
  }

  removeToken() {
    return this.sendMessage('oAuth.removeToken', this.provider);
  }

  startAuth(): Promise<ExtensionAPI.OAuth.OAuthPKCERequest> {
    return this.sendMessage('oAuth.startAuth', this.provider);
  }

  setToken(
    token:
      | ExtensionAPI.OAuth.OAuthToken
      | ExtensionAPI.OAuth.OAuthTokenResponse,
  ) {
    const normalizeToken: ExtensionAPI.OAuth.OAuthToken =
      'access_token' in token
        ? {
            scope: token.scope,
            expiresIn: token.expires_in,
            accessToken: token.access_token,
            refreshToken: token.refresh_token,
          }
        : token;

    return this.sendMessage('oAuth.setToken', this.provider, normalizeToken);
  }
}
