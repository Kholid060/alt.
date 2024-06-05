import {
  OAUTH_CALLBACK_URL,
  OAUTH_SERVER_PORT,
} from '#packages/common/utils/constant/constant';
import type { IncomingMessage, Server, ServerResponse } from 'node:http';
import { createServer } from 'node:http';
import DBService from './database/database.service';
import { debugLog } from '#packages/common/utils/helper';
import {
  CustomError,
  ExtensionError,
} from '#packages/common/errors/custom-errors';
import { z } from 'zod';
import { fromZodError } from 'zod-validation-error';
import { nanoid } from 'nanoid/non-secure';
import EventEmitter from 'eventemitter3';
import { shell } from 'electron';
import { logger } from '../lib/log';
import type { ExtensionCredential } from '@repo/extension-core/src/client/manifest/manifest-credential';

const SERVER_TIMEOUT_MS = 300_000; // 5 Minutes
const OAUTH_CALLBACK_PATHNAME = new URL(OAUTH_CALLBACK_URL).pathname;

const Oauth2CredValueSchema = z.object({
  clientId: z.string().min(1, { message: 'Missing clientId' }),
  clientSecret: z.string().min(1, { message: 'Missing clientId' }),
});

interface OauthServiceServerEvents {
  'authorize-callback': (url: URL) => void;
}
class OauthServiceServer extends EventEmitter<OauthServiceServerEvents> {
  private server: Server | null = null;
  private serverTimeout: NodeJS.Timeout | number = -1;

  constructor() {
    super();
    this.onRequest = this.onRequest.bind(this);
  }

  get isServerAlive() {
    return Boolean(this.server);
  }

  private resetTimeout() {
    clearTimeout(this.serverTimeout);
    this.serverTimeout = setTimeout(() => {
      this.server?.closeAllConnections();
      this.server?.close();
      this.server?.removeAllListeners();

      this.server = null;

      debugLog('Close OAuth server');
    }, SERVER_TIMEOUT_MS);
  }

  start() {
    if (this.server) {
      this.resetTimeout();
      return;
    }

    const server = createServer();
    server.on('request', this.onRequest);
    server.listen(OAUTH_SERVER_PORT);

    debugLog('Start OAuth server on port', OAUTH_SERVER_PORT);

    this.server = server;
    this.resetTimeout();
  }

  onRequest(req: IncomingMessage, res: ServerResponse) {
    if (!req.url) {
      res.statusCode = 404;
      res.end();
      return;
    }

    const url = new URL(req.url, 'http://localhost');
    if (url.pathname !== OAUTH_CALLBACK_PATHNAME) {
      res.statusCode = 404;
      res.end();
      return;
    }

    this.emit('authorize-callback', url);
    res.end('Success');
  }
}

const Oauth2ResponseSchema = z.object({
  token_type: z.string(),
  access_token: z.string(),
  scope: z.string().default(''),
  expires_in: z.number().default(0),
  refresh_token: z.string().optional(),
});
type Oauth2Response = z.infer<typeof Oauth2ResponseSchema>;

interface OAuth2ProviderOptions {
  clientId: string;
  callbackURL: string;
  clientSecret: string;
  provider: ExtensionCredential;
  resolver?: PromiseWithResolvers<Oauth2Response>;
  credential: { id: string; oauthTokenId: number | null };
}
class Oauth2Provider implements OAuth2ProviderOptions {
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
      throw new ExtensionError(`[${response.status}] ${response.statusText}`);
    }

    const result = await response.json();
    const token = await Oauth2ResponseSchema.parseAsync(result);

    return token;
  }

  async refreshAccessToken(refreshToken: string) {
    if (!this.provider.auth.tokenUrl) {
      throw new ExtensionError(
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
      throw new ExtensionError(`[${response.status}] ${response.statusText}`);
    }

    const result = await response.json();
    const token = await Oauth2ResponseSchema.parseAsync(result);

    return token;
  }
}

class OauthService {
  static instance = new OauthService();

  private server!: OauthServiceServer;
  private authSessions = new Map<
    string,
    {
      provider: Oauth2Provider;
      resolver?: PromiseWithResolvers<Oauth2Response>;
    }
  >();

  constructor() {
    this.initServer();
  }

  private initServer() {
    const server = new OauthServiceServer();
    server.addListener('authorize-callback', async (url) => {
      let resolver: undefined | PromiseWithResolvers<Oauth2Response>;

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
          credentialId: authSession.provider.credential.id,
          expiresTimestamp: Date.now() + token.expires_in * 1000,
        };

        if (authSession.provider.credential.oauthTokenId) {
          await DBService.instance.extension.updateCredentialOauthToken(
            payload,
          );
        } else {
          await DBService.instance.extension.insertCredentialOauthToken(
            payload,
          );
        }

        resolver?.resolve(token);
      } catch (error) {
        logger(
          'error',
          ['OAuthService', 'authorize-callback'],
          (<ExtensionError>error).message,
        );

        resolver?.reject(error);
      }
    });

    this.server = server;
  }

  async getProvider(
    credentialId: string | { providerId: string; extensionId: string },
  ) {
    const credential =
      await DBService.instance.extension.getCredentialValueDetail(credentialId);
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

    const credentialValue = await Oauth2CredValueSchema.safeParseAsync(
      credential.value,
    );
    if (!credentialValue.success) {
      throw new CustomError(fromZodError(credentialValue.error).message);
    }

    const oauth2Provider = new Oauth2Provider({
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
  ): Promise<Oauth2Response>;
  async startAuth(credentialId: string, waitAuth = false): Promise<unknown> {
    const oauth2Provider = await this.getProvider(credentialId);
    const sessionId = nanoid(8);

    const resolver = waitAuth
      ? Promise.withResolvers<Oauth2Response>()
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
      throw new ExtensionError("This app hasn't been connected");
    }

    const oauthToken =
      await DBService.instance.extension.getCredentialOAuthToken(
        oauthProvider.credential.oauthTokenId,
      );
    if (!oauthToken?.refreshToken) {
      throw new ExtensionError("This app doesn't have refresh token");
    }

    const token = await oauthProvider.refreshAccessToken(
      oauthToken.refreshToken,
    );

    await DBService.instance.extension.updateCredentialOauthToken({
      scope: token.scope,
      tokenType: token.token_type,
      accessToken: token.access_token,
      refreshToken: token.refresh_token,
      expiresTimestamp: Date.now() + token.expires_in * 1000,
    });

    return token;
  }
}

export default OauthService;
