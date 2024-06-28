import { Injectable, OnModuleInit } from '@nestjs/common';
import OAuthServer from './utils/OAuthServer';
import { LoggerService } from '../logger/logger.service';
import OAuth2Provider, { OAuth2Response } from './utils/OAuth2Provider';
import { ExtensionAuthTokenService } from '../extension/extension-auth-token/extension-auth-token.service';
import { CustomError } from '#packages/common/errors/custom-errors';
import { nanoid } from 'nanoid/non-secure';
import { ExtensionCredentialService } from '../extension/extension-credential/extension-credential.service';
import { OAuth2CredentialValueSchema } from './oauth.validation';
import { fromZodError } from 'zod-validation-error';
import { OAUTH_CALLBACK_URL } from '#packages/common/utils/constant/constant';

@Injectable()
export class OAuthService implements OnModuleInit {
  private server = new OAuthServer();
  private authSessions = new Map<
    string,
    {
      provider: OAuth2Provider;
      resolver?: PromiseWithResolvers<OAuth2Response>;
    }
  >();

  constructor(
    private logger: LoggerService,
    private extensionAuthToken: ExtensionAuthTokenService,
    private extensionCredential: ExtensionCredentialService,
  ) {}

  onModuleInit() {
    this.server.addListener('authorize-callback', async (url) => {
      let resolver: undefined | PromiseWithResolvers<OAuth2Response>;

      try {
        const code = url.searchParams.get('code');
        const state = url.searchParams.get('state');
        const authSession = state && this.authSessions.get(state);

        if (!code || !authSession) return;

        resolver = authSession.resolver;

        const token = await authSession.provider.exchangeCode(code);
        const payload = {
          scope: token.scope,
          tokenType: token.token_type,
          accessToken: token.access_token,
          refreshToken: token.refresh_token,
          expiresTimestamp: Date.now() + token.expires_in * 1000,
        };

        if (authSession.provider.credential.oauthTokenId) {
          await this.extensionAuthToken.updateToken(
            authSession.provider.credential.oauthTokenId,
            payload,
          );
        } else {
          await this.extensionAuthToken.insertToken({
            ...payload,
            credentialId: authSession.provider.credential.id,
          });
        }

        resolver?.resolve(token);
      } catch (error) {
        this.logger.error(['OAuthService', 'authorize-callback'], error);

        resolver?.reject(error);
      }
    });
  }

  async getProvider(
    credentialId: string | { providerId: string; extensionId: string },
  ) {
    const credential =
      await this.extensionCredential.getCredentialDetail(credentialId);
    if (!credential) {
      throw new CustomError(
        "Couldn't find the credential. Make sure the credential has been inputted",
      );
    }

    const provider = credential.extension?.credentials?.find(
      (provider) => provider.providerId === credential.providerId,
    );
    if (!provider) {
      throw new CustomError("Couldn't find the credential provider.");
    }

    const credentialValue = await OAuth2CredentialValueSchema.safeParseAsync(
      credential.value,
    );
    if (!credentialValue.success) {
      throw new CustomError(fromZodError(credentialValue.error).message);
    }

    const oauth2Provider = new OAuth2Provider({
      ...credentialValue.data,
      provider,
      callbackURL: OAUTH_CALLBACK_URL,
      credential: {
        id: credential.id,
        oauthTokenId: credential.oauthToken?.id ?? null,
      },
    });

    return oauth2Provider;
  }

  async startAuth(credentialId: string, waitAuth?: false): Promise<void>;
  async startAuth(
    credentialId: string,
    waitAuth?: true,
  ): Promise<OAuth2Response>;
  async startAuth(credentialId: string, waitAuth = false): Promise<unknown> {
    const oauth2Provider = await this.getProvider(credentialId);
    const sessionId = nanoid(8);

    const resolver = waitAuth
      ? Promise.withResolvers<OAuth2Response>()
      : undefined;

    this.authSessions.set(sessionId, {
      resolver,
      provider: oauth2Provider,
    });

    this.server.start();
    oauth2Provider.startAuth(sessionId);

    return resolver?.promise;
  }

  async refreshAccessToken(extensionId: string, providerId: string) {
    const oauthProvider = await this.getProvider({ extensionId, providerId });
    if (typeof oauthProvider.credential.oauthTokenId !== 'number') {
      throw new CustomError('No account connected to this app');
    }

    const oauthToken = await this.extensionAuthToken.getToken(
      oauthProvider.credential.oauthTokenId,
    );
    if (!oauthToken?.refreshToken) {
      throw new CustomError("This app doesn't have refresh token");
    }

    const token = await oauthProvider.refreshAccessToken(
      oauthToken.refreshToken,
    );
    await this.extensionAuthToken.updateToken(oauthToken.id, {
      scope: token.scope,
      tokenType: token.token_type,
      accessToken: token.access_token,
      refreshToken: token.refresh_token,
      expiresTimestamp: Date.now() + token.expires_in * 1000,
    });

    return token;
  }
}
