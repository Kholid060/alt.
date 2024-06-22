import type { ServerOptions } from 'socket.io';
import { Server } from 'socket.io';
import ExtensionWSNamespace from './ws-namespaces/extensions.ws-namespace';
import { WebSocketServer } from 'ws';
import { debuglog } from 'util';
import { APP_WEBSOCKET_PORT } from '@alt-dot/shared';

class WebsocketService {
  private static _instance: WebsocketService | null = null;
  static get instance() {
    return this._instance || (this._instance = new WebsocketService());
  }

  static startDefaultServer() {
    this.instance.startServer(APP_WEBSOCKET_PORT);
  }

  private io: Server | null = null;

  startServer(port: number, options: Partial<ServerOptions> = {}) {
    this.io = new Server(port, {
      cors: {
        origin: '*',
      },
      wsEngine: WebSocketServer,
      ...options,
    });

    this.io.engine.on('connection', (socket) => {
      socket.request = null;
    });

    ExtensionWSNamespace.instance.init(this.io);

    debuglog(`Websocket server starting on port ${port}`);
  }
}

export default WebsocketService;
