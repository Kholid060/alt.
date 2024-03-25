import type {
  ExtensionWSClientToServerEvents,
  ExtensionWSServerToClientEvents,
} from '@repo/shared';
import type { Namespace } from 'socket.io';

type ExtensionNamespace = Namespace<
  ExtensionWSClientToServerEvents,
  ExtensionWSServerToClientEvents
>;

class ExtensionNamespaceService {
  namespace: ExtensionNamespace;

  constructor(namespace: ExtensionNamespace) {
    this.namespace = namespace;

    this.init();
  }

  private init() {
    this.namespace.use((socket, next) => {
      console.log(socket.handshake.headers.origin);
      next();
    });

    this.namespace.on('connection', (socket) => {
      socket.on('active-browser-tab', (tab) => {
        console.log('active tab', tab);
      });
      socket.onAny((...args) => {
        console.log(args);
      });
    });
  }
}

export default ExtensionNamespaceService;
