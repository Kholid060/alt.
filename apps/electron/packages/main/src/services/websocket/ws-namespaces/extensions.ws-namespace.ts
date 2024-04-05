/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
  BrowserInfo,
  ExtensionSocketData,
  ExtensionWSClientToServerEvents,
  ExtensionWSInterServerEvents,
  ExtensionWSServerToClientEvents,
} from '@repo/shared';
import type { Namespace, Server } from 'socket.io';
import type { AllButLast, Last } from 'socket.io/dist/typed-events';
import { initExtensionWSEventsListener } from '../ws-events/extensions.ws-event';
import { z } from 'zod';

export type ExtensionNamespace = Namespace<
  ExtensionWSClientToServerEvents,
  ExtensionWSServerToClientEvents,
  ExtensionWSInterServerEvents,
  ExtensionSocketData
>;

interface SocketEvents {
  'socket:connected': (browserInfo: BrowserInfo) => void;
  'socket:disconnect': (browserInfo: BrowserInfo, reason: string) => void;
}

const BROWSER_EMIT_TIMEOUT_MS = 10_000;

const BrowserInfoValidation = z.object({
  id: z.string(),
  name: z.string(),
  version: z.string(),
}) satisfies z.ZodType<BrowserInfo>;

class ExtensionWSNamespace {
  private static _instance: ExtensionWSNamespace | null = null;
  static get instance() {
    if (!this._instance) {
      this._instance = new ExtensionWSNamespace();
    }

    return this._instance;
  }

  private socketEvents = new Map<
    keyof ExtensionWSClientToServerEvents,
    (...args: any[]) => unknown
  >();
  private _namespace: ExtensionNamespace | null = null;
  private browsersSockets: Map<string, string> = new Map();

  private events: Record<string, ((...args: any[]) => void)[]> = {};

  constructor() {}

  init(server: Server) {
    this._namespace = server.of('/extensions');

    this._namespace.use((socket, next) => {
      const browserInfo: BrowserInfo = socket.handshake.auth?.browserInfo;
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
      this.emit('socket:connected', socket.data.browserInfo);

      this.browsersSockets.set(socket.data.browserInfo.id, socket.id);
      this.socketEvents.forEach((listener, eventName) => {
        socket.on(eventName, (...args) => {
          listener({ browserInfo: socket.data.browserInfo }, ...args);
        });
      });
      socket.on('disconnect', (reason) => {
        console.log('SOCKET DISCONNECT:', reason);
        this.emit('socket:disconnect', socket.data.browserInfo, reason);
        this.browsersSockets.delete(socket.data.browserInfo.id);
      });
    });

    initExtensionWSEventsListener.call(this);
  }

  get namespace() {
    if (!this._namespace) {
      throw new Error("WebSocket server hasn't been initialized");
    }

    return this._namespace;
  }

  on<T extends keyof SocketEvents>(
    name: T,
    callback: (...args: Parameters<SocketEvents[T]>) => void,
  ) {
    if (!this.events[name]) this.events[name] = [];

    this.events[name].push(callback as () => void);
  }

  emit<T extends keyof SocketEvents>(
    name: T,
    ...args: Parameters<SocketEvents[T]>
  ) {
    const listeners = this.events[name];
    if (!listeners) return;

    listeners.forEach((listener) => {
      listener(...args);
    });
  }

  off<T extends keyof SocketEvents>(
    name: T,
    callback: (...args: Parameters<SocketEvents[T]>) => void,
  ) {
    const listeners = this.events[name];
    if (!listeners) return;

    const index = listeners.indexOf(callback as () => void);
    if (index === -1) return;

    this.events[name].splice(index, 1);
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

  getBrowserSocket(browserId: string) {
    const socketId = this.browsersSockets.get(browserId);
    if (!socketId) return null;

    const socket = this.namespace.sockets.get(socketId);
    if (!socket) return null;

    return socket;
  }

  emitToBrowser<T extends keyof ExtensionWSServerToClientEvents>(
    browserId: string,
    name: T,
    ...args: Parameters<ExtensionWSServerToClientEvents[T]>
  ) {
    const socket = this.getBrowserSocket(browserId);
    if (!socket) throw new Error("Couldn't find browser socket");

    return socket.emit(name, ...args);
  }

  emitToBrowserWithAck<T extends keyof ExtensionWSServerToClientEvents>(
    browserId: string,
    name: T,
    ...args: AllButLast<Parameters<ExtensionWSServerToClientEvents[T]>>
  ): Promise<
    Parameters<Last<Parameters<ExtensionWSServerToClientEvents[T]>>>[0]
  > {
    const socket = this.getBrowserSocket(browserId);
    if (!socket) throw new Error("Couldn't find browser socket");

    return socket
      .timeout(BROWSER_EMIT_TIMEOUT_MS)
      .emitWithAck(name as never, ...(args as never));
  }
}

export default ExtensionWSNamespace;
