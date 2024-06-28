import {
  OAUTH_CALLBACK_URL,
  OAUTH_SERVER_PORT,
} from '#packages/common/utils/constant/constant';
import { debugLog } from '#packages/common/utils/helper';
import { EventEmitter } from 'eventemitter3';
import {
  createServer,
  type IncomingMessage,
  type Server,
  type ServerResponse,
} from 'node:http';

interface OAuthServerEvents {
  'authorize-callback': (url: URL) => void;
}

const SERVER_TIMEOUT_MS = 300_000; // 5 Minutes
const OAUTH_CALLBACK_PATHNAME = new URL(OAUTH_CALLBACK_URL).pathname;

class OAuthServer extends EventEmitter<OAuthServerEvents> {
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

export default OAuthServer;
