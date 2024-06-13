/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
  BrowserConnected,
  BrowserInfo,
  BrowserType,
  ExtensionSocketData,
  ExtensionWSClientToServerEvents,
  ExtensionWSInterServerEvents,
  ExtensionWSServerToClientEvents,
} from '@alt-dot/shared';
import type { Namespace, Server } from 'socket.io';
import type { AllButLast, Last } from 'socket.io/dist/typed-events';
import { z } from 'zod';
import BrowserService from '../../browser.service';

export type ExtensionNamespace = Namespace<
  ExtensionWSClientToServerEvents,
  ExtensionWSServerToClientEvents,
  ExtensionWSInterServerEvents,
  ExtensionSocketData
>;

const BROWSER_EMIT_TIMEOUT_MS = 60_000;
const BROWSER_TYPE = [
  'edge',
  'chrome',
  'firefox',
] as const satisfies BrowserType[];

const BrowserInfoSchema = z.object({
  id: z.string(),
  name: z.string(),
  version: z.string(),
  type: z.enum(BROWSER_TYPE),
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

  constructor() {}

  init(server: Server) {
    this._namespace = server.of('/extensions');

    this._namespace.use((socket, next) => {
      const browserConnected = BrowserInfoSchema.safeParse(
        socket.handshake.auth?.browserInfo,
      );
      if (!browserConnected.success) {
        next(new Error('Unauthorized'));
        return;
      }

      socket.data.browserInfo = browserConnected.data;
      BrowserService.instance.addConnectedBrowser(socket.data.browserInfo);

      next();
    });

    this._namespace.on('connection', (socket) => {
      this.browsersSockets.set(socket.data.browserInfo.id, socket.id);
      this.socketEvents.forEach((listener, eventName) => {
        socket.on(eventName, (...args) => {
          listener({ browserInfo: socket.data.browserInfo }, ...args);
        });
      });

      socket.on('disconnect', (reason) => {
        console.log('SOCKET DISCONNECT:', reason);
        BrowserService.instance.removeConnectedBrowser(
          socket.data.browserInfo.id,
        );
      });
    });
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
      sender: { browser: BrowserConnected },
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

  emitToBrowserWithAck<T extends keyof ExtensionWSServerToClientEvents>({
    args,
    name,
    timeout,
    browserId,
  }: {
    name: T;
    timeout?: number;
    browserId: string;
    args: AllButLast<Parameters<ExtensionWSServerToClientEvents[T]>>;
  }): Promise<
    Parameters<Last<Parameters<ExtensionWSServerToClientEvents[T]>>>[0]
  > {
    const socket = this.getBrowserSocket(browserId);
    if (!socket) throw new Error("Couldn't find browser socket");

    return socket
      .timeout(timeout ?? BROWSER_EMIT_TIMEOUT_MS)
      .emitWithAck(name as never, ...(args as never));
  }
}

export default ExtensionWSNamespace;
