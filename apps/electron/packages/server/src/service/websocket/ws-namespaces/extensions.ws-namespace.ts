import type { BrowserInfo } from '@repo/shared';
import {
  BrowserInfoValidation,
  type ExtensionSocketData,
  type ExtensionWSClientToServerEvents,
  type ExtensionWSInterServerEvenets,
  type ExtensionWSServerToClientEvents,
} from '@repo/shared';
import type { Namespace, Server } from 'socket.io';
import MessagePortService from '../../message-port/message-port.service';
import type { AllButLast, Last } from 'socket.io/dist/typed-events';

export type ExtensionNamespace = Namespace<
  ExtensionWSClientToServerEvents,
  ExtensionWSServerToClientEvents,
  ExtensionWSInterServerEvenets,
  ExtensionSocketData
>;

const BROWSER_EMIT_TIMEOUT_MS = 10_000;

class ExtensionWSNamespace {
  private static _instance: ExtensionWSNamespace | null = null;
  static get instance() {
    if (!this._instance) {
      this._instance = new ExtensionWSNamespace();
    }

    return this._instance;
  }

  private socketEvents = new Map<
    string | number | symbol,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (...args: any[]) => unknown
  >();

  private _namespace: ExtensionNamespace | null;

  constructor() {
    this._namespace = null;
  }

  init(server: Server) {
    this._namespace = server.of('/extensions');

    this._namespace.use((socket, next) => {
      const browserInfo = socket.handshake.auth?.browserInfo;
      const browserInfoValidation =
        BrowserInfoValidation.safeParse(browserInfo);
      if (!browserInfoValidation.success) {
        next(new Error('Unauthorized'));
        return;
      }

      socket.data.browserInfo = browserInfoValidation.data;

      next();
    });

    this._namespace.on('connection', (socket) => {
      MessagePortService.instance.sendMessage(
        'socket:connect',
        socket.data.browserInfo,
      );

      socket.join(socket.data.browserInfo.id);
      socket.onAny((eventName, ...data) => {
        const listener = this.socketEvents.get(eventName);
        if (!listener) {
          console.error(`"${eventName}" doesn't have handler`);
          return;
        }

        listener({ browserInfo: socket.data.browserInfo }, ...data);
      });
      socket.on('disconnect', (reason) => {
        MessagePortService.instance.sendMessage(
          'socket:disconnect',
          socket.data.browserInfo,
          reason,
        );
      });
    });

    import('../ws-events/extensions.ws-event');
  }

  get namespace() {
    if (!this._namespace) {
      throw new Error("WebSocket server hasn't been initialized");
    }

    return this._namespace;
  }

  onSocketEvent<T extends keyof ExtensionWSClientToServerEvents>(
    name: T,
    callback: (
      sender: { browserInfo: BrowserInfo },
      ...args: Parameters<ExtensionWSClientToServerEvents[T]>
    ) => void,
  ) {
    this.socketEvents.set(name, callback);
  }

  emitToBrowser<T extends keyof ExtensionWSServerToClientEvents>(
    browserId: string,
    name: T,
    ...args: Parameters<ExtensionWSServerToClientEvents[T]>
  ) {
    return this.namespace
      .timeout(BROWSER_EMIT_TIMEOUT_MS)
      .to(browserId)
      .emit(name, ...args);
  }

  emitToBrowserWithAck<T extends keyof ExtensionWSServerToClientEvents>(
    browserId: string,
    name: T,
    ...args: AllButLast<Parameters<ExtensionWSServerToClientEvents[T]>>
  ): Promise<
    [Parameters<Last<Parameters<ExtensionWSServerToClientEvents[T]>>>[0]]
  > {
    return this.namespace
      .timeout(BROWSER_EMIT_TIMEOUT_MS)
      .to(browserId)
      .emitWithAck(name as never, ...(args as never));
  }
}

export default ExtensionWSNamespace;
