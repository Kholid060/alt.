import type { ServerOptions } from 'socket.io';
import { Server } from 'socket.io';
import ExtensionWSNamespace from './ws-namespaces/extensions.ws-namespace';

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
      ...options,
    });

    ExtensionWSNamespace.instance.init(this.io);

    console.log(`Server starting on port ${port}`);
  }
}

export function initDefaultWebsocketServer() {
  const PORT = 4567;

  return WebsocketService.instance.initServer(PORT);
}

export default WebsocketService;
