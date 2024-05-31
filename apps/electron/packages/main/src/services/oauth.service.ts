import {
  OAUTH_CALLBACK_URL,
  OAUTH_SERVER_PORT,
} from '#packages/common/utils/constant/constant';
import type { IncomingMessage, Server, ServerResponse } from 'node:http';
import { createServer } from 'node:http';
import DBService from './database/database.service';
import { debugLog } from '#packages/common/utils/helper';
import { CustomError } from '#packages/common/errors/custom-errors';
import { z } from 'zod';
import { fromZodError } from 'zod-validation-error';
import type { ExtensionCredential } from '@repo/extension-core/src/client/manifest/manifest-credential';
import { nanoid } from 'nanoid/non-secure';
import EventEmitter from 'eventemitter3';
import { shell } from 'electron';
import { logger } from '../lib/log';

const SERVER_TIMEOUT_MS = 300_000; // 5 Minutes
const OAUTH_CALLBACK_PATHNAME = new URL(OAUTH_CALLBACK_URL).pathname;

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
  scope: z.string(),
  expires_in: z.number(),
  token_type: z.string(),
  access_token: z.string(),
  refresh_token: z.string().optional(),
});
interface OAuth2ProviderOptions {
  clientId: string;
  callbackURL: string;
  clientSecret: string;
  provider: ExtensionCredential;
  credential: { id: string; oauthTokenId: number | null };
}
class Oauth2Provider implements OAuth2ProviderOptions {
  id: string;
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
    this.id = nanoid();
    this.clientId = clientId;
    this.provider = provider;
    this.credential = credential;
    this.callbackURL = callbackURL;
    this.clientSecret = clientSecret;
  }

  startAuth() {
    const { auth: providerAuth } = this.provider;

    const searchParams = new URLSearchParams(providerAuth.extraParams ?? '');
    searchParams.set('state', this.id);
    searchParams.set('response_type', 'code');
    searchParams.set('client_id', this.clientId);
    searchParams.set('redirect_uri', this.callbackURL);
    searchParams.set('scope', this.provider.auth.scope);

    const authorizeUrl = `${this.provider.auth.authorizeUrl}?${searchParams.toString()}`;
    console.log(authorizeUrl);

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
      },
    );
    if (!response.ok) {
      throw new Error(`[${response.status}] ${response.statusText}`);
    }

    const result = await response.json();
    const token = await Oauth2ResponseSchema.parseAsync(result);

    return token;
  }
}

const Oauth2CredValueSchema = z.object({
  clientId: z.string().min(1, { message: 'Missing clientId' }),
  clientSecret: z.string().min(1, { message: 'Missing clientId' }),
});
class OauthService {
  static instance = new OauthService();

  private server!: OauthServiceServer;
  private authSessions = new Map<string, Oauth2Provider>();

  constructor() {
    this.initServer();
  }

  private initServer() {
    const server = new OauthServiceServer();
    server.addListener('authorize-callback', async (url) => {
      try {
        const code = url.searchParams.get('code');
        const state = url.searchParams.get('state');
        const authProvider = state && this.authSessions.get(state);

        if (!code || !authProvider) return;

        const token = await authProvider.exchangeCode(code);
        const payload = {
          scope: token.scope,
          tokenType: token.token_type,
          accessToken: token.access_token,
          refreshToken: token.refresh_token,
          credentialId: authProvider.credential.id,
          expiresTimestamp: Date.now() + token.expires_in * 1000,
        };

        if (authProvider.credential.oauthTokenId) {
          await DBService.instance.extension.updateCredentialOauthToken(
            payload,
          );
        } else {
          await DBService.instance.extension.insertCredentialOauthToken(
            payload,
          );
        }
      } catch (error) {
        logger(
          'error',
          ['OAuthService', 'authorize-callback'],
          (<Error>error).message,
        );
      }
    });

    this.server = server;
  }

  async startAuth(credentialId: string) {
    const credential =
      await DBService.instance.extension.getCredentialValueDetail(credentialId);
    if (!credential) {
      throw new CustomError(
        "Couldn't find the credential. Make sure the credential has been inputted",
      );
    }

    if (credential.type !== 'oauth2') {
      throw new Error('Unsupported Auth type');
    }

    const provider = credential.extension.credentials.find(
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

    this.authSessions.set(oauth2Provider.id, oauth2Provider);

    this.server.start();
    oauth2Provider.startAuth();
  }
}

export default OauthService;
