import type { ServerOptions } from 'socket.io';
import { Server } from 'socket.io';
import ExtensionNamespaceService from './extension-namespace.service';

class WebsocketService {
  private static _instance: WebsocketService | null = null;

  static get instance() {
    if (!this._instance) {
      this._instance = new WebsocketService();
    }

    return this._instance;
  }

  private io: Server | null = null;
  private extensionNamespace: ExtensionNamespaceService | null = null;

  constructor() {}

  initServer(port: number, options: Partial<ServerOptions> = {}) {
    this.io = new Server(port, {
      cors: {
        origin: '*',
      },
      ...options,
    });

    const extensionNamespace = this.io.of('/extensions');
    this.extensionNamespace = new ExtensionNamespaceService(extensionNamespace);

    console.log(`Server starting on port ${port}`);
  }
}

export default WebsocketService;
