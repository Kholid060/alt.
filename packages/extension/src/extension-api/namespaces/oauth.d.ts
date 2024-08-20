export declare namespace OAuth {
  interface OAuthPKCEClientOptions {
    scope: string;
    clientId: string;
    authorizeUrl: string;
    redirectMethod?: OAuthRedirect;
    extraParams?: Record<string, string>;
  }

  interface OAuthProvider {
    key: string;
    name: string;
    icon: string;
    description?: string;
    documentationUrl?: string;
    client: OAuthPKCEClientOptions;
  }

  interface OAuthPKCERequest {
    code: string;
    redirectUri: string;
    codeVerifier: string;
    codeChallenge: string;
  }

  interface OAuthToken {
    scope?: string;
    expiresIn?: number;
    accessToken: string;
    refreshToken?: string;
  }

  interface OAuthTokenResponse {
    scope?: string;
    expires_in?: number;
    access_token: string;
    refresh_token?: string;
  }

  interface OAuthTokenStorageValue extends OAuthToken {
    expiresTimestamp: number;
  }

  abstract class OAuthPKCEClient {
    abstract removeToken(): Promise<void>;
    abstract startAuth(): Promise<OAuthPKCERequest>;
    abstract getToken(): Promise<OAuthTokenStorageValue | null>;
    abstract setToken(
      token: OAuthToken | OAuthTokenResponse,
    ): Promise<OAuthTokenStorageValue>;
  }

  enum OAuthRedirect {
    Web = 'web',
    AppUrl = 'app-url',
    DeepLink = 'deep-link',
  }

  interface Static {
    // @ext-api-value
    createPKCE(provider: OAuthProvider): OAuthPKCEClient;
  }
}
