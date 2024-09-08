import { createServer, IncomingMessage, Server, ServerResponse } from 'http';
import getPort from 'get-port';
import { isObject, parseJSON } from '@altdot/shared';

export type ConsoleMethod = 'log' | 'info' | 'warn' | 'error';

export const CONSOLE_VALID_METHOD: Set<ConsoleMethod> = new Set([
  'log',
  'info',
  'warn',
  'error',
]);

class ExtensionBuilderServer {
  readonly server: Server;

  constructor() {
    this.server = createServer(this.requestListener.bind(this));
  }

  private requestListener(req: IncomingMessage, res: ServerResponse) {
    if (req.headers['content-type'] !== 'application/json') {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          status: 400,
          message: 'Invalid request',
        }),
      );
      return;
    }

    if (req.url === '/console' && req.method === 'POST') {
      this.handleConsole(req, res);
      return;
    }

    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        status: 404,
        message: 'Not found',
      }),
    );
  }

  private async handleConsole(req: IncomingMessage, res: ServerResponse) {
    if (req.headers['content-type'] !== 'application/json') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          status: 200,
          message: 'Success',
        }),
      );

      return;
    }

    const bodyChunks: Buffer[] = [];
    req
      .on('data', (chunk: Buffer) => {
        bodyChunks.push(chunk);
      })
      .on('end', () => {
        const body = parseJSON<{ type: ConsoleMethod; args: unknown[] }, null>(
          Buffer.concat(bodyChunks).toString(),
          null,
        );
        if (
          !body ||
          !isObject(body) ||
          !body.type ||
          !Array.isArray(body.args) ||
          !CONSOLE_VALID_METHOD.has(body.type)
        ) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(
            JSON.stringify({
              status: 400,
              message: 'Invalid request',
            }),
          );
          return;
        }

        console[body.type](...body.args);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            status: 200,
            message: 'Success',
          }),
        );
      });
  }

  async start() {
    const port = await getPort();
    this.server.listen(port);

    return { port };
  }
}

export default ExtensionBuilderServer;
