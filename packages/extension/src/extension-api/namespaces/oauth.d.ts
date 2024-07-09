export declare namespace OAuth {
  enum OAuthRedirect {
    Web = 'web',
    AppUrl = 'app-url',
    DeepLink = 'deep-link',
  }

  interface OAuthPKCEClient {
    type: 'pkce';
    scope: string;
    clientId: string;
    authorizeUrl: string;
    redirectMethod?: OAuthRedirect;
    extraParams?: Record<string, string>;
  }

  interface OAuthProvider {
    name: string;
    icon: string;
    description?: string;
    client: OAuthPKCEClient;
    documentationUrl?: string;
  }

  interface OAuthPKCERequest {
    code: string;
    codeVerifier: string;
    codeChallenge: string;
  }

  interface OAuthToken {
    scope?: string;
    expiresIn?: number;
    accessToken: string;
    refreshToken?: string;
  }

  interface Static {
    removeTokens(key?: string | string[]): Promise<void>;
    setToken(key: string, token: OAuthToken): Promise<void>;
    startAuth(provider: OAuthProvider): Promise<OAuthPKCERequest | null>;
    getTokens<T extends string>(key?: T): Promise<Record<T, OAuthToken | null>>;
  }
}
