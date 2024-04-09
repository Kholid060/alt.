import type { ServerOptions } from 'socket.io';
import { Server } from 'socket.io';
import ExtensionWSNamespace from './ws-namespaces/extensions.ws-namespace';
import { WebSocketServer } from 'ws';

class WebsocketService {
  private static _instance: WebsocketService | null = null;

  static get instance() {
    if (!this._instance) {
      this._instance = new WebsocketService();
    }

    return this._instance;
  }

  private io: Server | null = null;

  initServer(port: number, options: Partial<ServerOptions> = {}) {
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

    console.log(`Websocket server starting on port ${port}`);
  }
}

export function initDefaultWebsocketServer() {
  const PORT = 4567;

  return WebsocketService.instance.initServer(PORT);
}

export default WebsocketService;
