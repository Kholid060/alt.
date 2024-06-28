import { CustomError } from '#packages/common/errors/custom-errors';
import { OAUTH_CALLBACK_URL } from '#packages/common/utils/constant/constant';
import { ExtensionCredential } from '@alt-dot/extension-core';
import { shell } from 'electron';
import { OAuth2Response, OAuth2ResponseSchema } from '../oauth.validation';

export interface OAuth2ProviderOptions {
  clientId: string;
  callbackURL: string;
  clientSecret: string;
  provider: ExtensionCredential;
  resolver?: PromiseWithResolvers<OAuth2Response>;
  credential: { id: string; oauthTokenId: number | null };
}

class OAuth2Provider implements OAuth2ProviderOptions {
  clientId: string;
  callbackURL: string;
  clientSecret: string;
  provider: ExtensionCredential;
  credential: { id: string; oauthTokenId: number | null };

  constructor({
    clientId,
    provider,
    credential,
    callbackURL,
    clientSecret,
  }: OAuth2ProviderOptions) {
    this.clientId = clientId;
    this.provider = provider;
    this.credential = credential;
    this.callbackURL = callbackURL;
    this.clientSecret = clientSecret;
  }

  startAuth(sessionId: string) {
    const { auth: providerAuth } = this.provider;

    const searchParams = new URLSearchParams(providerAuth.extraParams ?? '');
    searchParams.set('state', sessionId);
    searchParams.set('response_type', 'code');
    searchParams.set('client_id', this.clientId);
    searchParams.set('redirect_uri', this.callbackURL);
    searchParams.set('scope', this.provider.auth.scope);

    const authorizeUrl = `${this.provider.auth.authorizeUrl}?${searchParams.toString()}`;

    shell.openExternal(authorizeUrl);
  }

  async exchangeCode(code: string) {
    const searchParams = new URLSearchParams();
    searchParams.set('code', code);
    searchParams.set('client_id', this.clientId);
    searchParams.set('client_secret', this.clientSecret);
    searchParams.set('grant_type', 'authorization_code');
    searchParams.set('redirect_uri', OAUTH_CALLBACK_URL);

    const response = await fetch(
      `${this.provider.auth.tokenUrl}?${searchParams.toString()}`,
      {
        method: 'POST',
        headers: {
          Accept: 'application/json',
        },
      },
    );
    if (!response.ok) {
      throw new CustomError(`[${response.status}] ${response.statusText}`);
    }

    const result = await response.json();
    const token = await OAuth2ResponseSchema.parseAsync(result);

    return token;
  }

  async refreshAccessToken(refreshToken: string) {
    if (!this.provider.auth.tokenUrl) {
      throw new CustomError(
        'The credential provider doesn\'t have "tokenUrl" in its manifest',
      );
    }

    const searchParams = new URLSearchParams();
    searchParams.set('client_id', this.clientId);
    searchParams.set('grant_type', 'refresh_token');
    searchParams.set('refresh_token', refreshToken);
    searchParams.set('client_secret', this.clientSecret);

    const response = await fetch(
      `${this.provider.auth.tokenUrl}?${searchParams.toString()}`,
      {
        method: 'POST',
      },
    );
    if (!response.ok) {
      throw new CustomError(`[${response.status}] ${response.statusText}`);
    }

    const result = await response.json();
    const token = await OAuth2ResponseSchema.parseAsync(result);

    return token;
  }
}

export default OAuth2Provider;
