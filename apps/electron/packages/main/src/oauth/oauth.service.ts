import { Injectable } from '@nestjs/common';
import { CustomError } from '#packages/common/errors/custom-errors';
import { nanoid } from 'nanoid/non-secure';
import crypto from 'crypto';
import { OAuthRedirect, type ExtensionAPI } from '@altdot/extension';
import { BrowserWindowService } from '../browser-window/browser-window.service';
import { APP_DEEP_LINK_SCHEME, APP_USER_MODEL_ID } from '@altdot/shared';
import { APP_DEEP_LINK_HOST } from '#packages/common/utils/constant/app.const';
import { ConfigService } from '@nestjs/config';
import { AppEnv } from '../common/validation/app-env.validation';
import { SelectExtension } from '../db/schema/extension.schema';
import { ExtensionOAuthTokensService } from '../extension/extension-oauth-tokens/extension-oauth-tokens.service';
import dayjs from 'dayjs';

const MAX_SESSION_AGE_MS = 15 * 60 * 1000; // 15 minutes

@Injectable()
export class OAuthService {
  private authSessions = new Map<
    string,
    {
      createdAt: Date;
      payload: Omit<ExtensionAPI.OAuth.OAuthPKCERequest, 'code'>;
      resolver: PromiseWithResolvers<ExtensionAPI.OAuth.OAuthPKCERequest>;
    }
  >();

  constructor(
    private config: ConfigService<AppEnv, true>,
    private browserWindow: BrowserWindowService,
    private extensionOAuthToken: ExtensionOAuthTokensService,
  ) {}

  private clearExpSession() {
    const currTime = new Date().getTime();
    this.authSessions.forEach((value, key) => {
      if (currTime - value.createdAt.getTime() >= MAX_SESSION_AGE_MS) {
        value.resolver.reject(new Error('EXPIRED'));
        // eslint-disable-next-line drizzle/enforce-delete-with-where
        this.authSessions.delete(key);
      }
    });
  }

  async resolveAuthSession(url: string | URL) {
    const urlObj = typeof url === 'string' ? new URL(url) : url;
    const sessionId = urlObj.searchParams.get('state');
    if (!sessionId) return;

    const session = this.authSessions.get(sessionId);
    if (!session) return null;

    const { payload, resolver } = session;
    resolver.resolve({
      ...payload,
      code: urlObj.searchParams.get('code')!,
    });

    // eslint-disable-next-line drizzle/enforce-delete-with-where
    this.authSessions.delete(sessionId);

    const windowCommand = await this.browserWindow.get('command');
    await windowCommand.toggleWindow(true);
    windowCommand.sendMessage('command-window:oauth-success', sessionId);
  }

  generateAuth(
    sessionId: string,
    client: ExtensionAPI.OAuth.OAuthProvider['client'],
  ) {
    const codeVerifier = nanoid(64);
    const codeChallenge = crypto
      .createHash('SHA256')
      .update(codeVerifier)
      .digest('base64url');

    const url = new URL(client.authorizeUrl);
    if (client.extraParams) {
      Object.keys(client.extraParams).forEach((key) => {
        url.searchParams.set(key, client.extraParams![key]);
      });
    }

    url.searchParams.set('response_type', 'code');
    url.searchParams.set('code_challenge_method', 'S256');
    url.searchParams.set('scope', client.scope);
    url.searchParams.set('code_challenge', codeChallenge);
    url.searchParams.set('client_id', client.clientId);
    url.searchParams.set('state', sessionId);

    let redirectUri = '';
    switch (client.redirectMethod || OAuthRedirect.Web) {
      case OAuthRedirect.AppUrl:
        redirectUri = `${APP_USER_MODEL_ID}:/oauth2callback`;
        break;
      case OAuthRedirect.DeepLink:
        redirectUri = `${APP_DEEP_LINK_SCHEME}://${APP_DEEP_LINK_HOST.oauth}/redirect`;
        break;
      case OAuthRedirect.Web:
        redirectUri = new URL(
          '/oauth2/extension/redirect',
          this.config.get('VITE_WEB_BASE_URL'),
        ).href;
        break;
      default:
        throw new CustomError('Invalid OAuth redirect method');
    }
    url.searchParams.set('redirect_uri', redirectUri);

    return { url, codeVerifier, codeChallenge, redirectUri };
  }

  async startAuthOverlay(
    provider: ExtensionAPI.OAuth.OAuthProvider,
    extension: Pick<SelectExtension, 'title' | 'icon' | 'id'>,
  ) {
    this.clearExpSession();

    const windowCommand = await this.browserWindow.get('command');
    await windowCommand.toggleWindow(true);

    const sessionId = nanoid();
    const { codeChallenge, codeVerifier, url, redirectUri } = this.generateAuth(
      sessionId,
      provider.client,
    );

    const resolver =
      Promise.withResolvers<ExtensionAPI.OAuth.OAuthPKCERequest>();
    this.authSessions.set(sessionId, {
      resolver,
      createdAt: new Date(),
      payload: { codeChallenge, codeVerifier, redirectUri },
    });

    windowCommand.sendMessage('command-window:show-oauth-overlay', {
      provider,
      sessionId,
      extension,
      authUrl: url.href,
    });

    return resolver.promise;
  }

  async getExtensionToken(
    extensionId: string,
    { client, key }: ExtensionAPI.OAuth.OAuthProvider,
  ): Promise<ExtensionAPI.OAuth.OAuthTokenStorageValue | null> {
    const token = await this.extensionOAuthToken.get({
      key,
      extensionId,
      clientId: client.clientId,
    });
    if (!token) return null;

    return {
      accessToken: token.accessToken,
      scope: token.scope ?? undefined,
      refreshToken: token.refreshToken,
      expiresTimestamp: token.expiresTimestamp ?? 0,
      expiresIn: token.expiresTimestamp
        ? Math.max(
            0,
            new Date(token.expiresTimestamp).getTime() - new Date().getTime(),
          ) / 1000
        : 0,
    };
  }

  async setExtensionToken(
    {
      key,
      icon,
      name,
      client,
      extensionId,
    }: ExtensionAPI.OAuth.OAuthProvider & {
      extensionId: string;
    },
    payload: ExtensionAPI.OAuth.OAuthToken,
  ) {
    await this.extensionOAuthToken.upsert(
      {
        key,
        extensionId,
        clientId: client.clientId,
      },
      {
        ...payload,
        key,
        extensionId,
        providerIcon: icon,
        providerName: name,
        clientId: client.clientId,
        expiresTimestamp: payload.expiresIn
          ? dayjs().add(payload.expiresIn, 'second').valueOf()
          : null,
      },
    );
  }
}
