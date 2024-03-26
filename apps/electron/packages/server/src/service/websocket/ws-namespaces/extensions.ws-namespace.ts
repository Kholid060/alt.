import type {
  ExtensionWSClientToServerEvents,
  ExtensionWSServerToClientEvents,
} from '@repo/shared';
import type { Namespace, Server } from 'socket.io';

export type ExtensionNamespace = Namespace<
  ExtensionWSClientToServerEvents,
  ExtensionWSServerToClientEvents
>;

class ExtensionWSNamespace {
  private static _instance: ExtensionWSNamespace | null = null;
  static get instance() {
    if (!this._instance) {
      this._instance = new ExtensionWSNamespace();
    }

    return this._instance;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private socketEvents = new Map<string, (...args: any[]) => unknown>();

  namespace: ExtensionNamespace | null;

  constructor() {
    this.namespace = null;
  }

  init(server: Server) {
    this.namespace = server.of('/extensions');

    this.namespace.use((socket, next) => {
      console.log(socket.handshake.headers.origin);
      next();
    });

    this.namespace.on('connection', (socket) => {
      socket.onAny((eventName, ...data) => {
        const listener = this.socketEvents.get(eventName);
        if (!listener) {
          console.error(`"${eventName}" doesn't have handler`);
          return;
        }

        listener(...data);
      });
    });

    import('../ws-events/extensions.ws-event');
  }

  onSocketEvent<T extends keyof ExtensionWSClientToServerEvents>(
    name: T,
    callback: (...args: Parameters<ExtensionWSClientToServerEvents[T]>) => void,
  ) {
    this.socketEvents.set(name, callback);
  }
}

export default ExtensionWSNamespace;
