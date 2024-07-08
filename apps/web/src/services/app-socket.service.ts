import { io } from 'socket.io-client';
import {
  APP_WEBSOCKET_PORT,
  PromiseWithResolver,
  promiseWithResolver,
  WebAppWSClientToServerEvents,
} from '@altdot/shared';

const APP_WEBSOCKET_URL = `ws://localhost:${APP_WEBSOCKET_PORT}/web-app`;

export type AppSocketState = 'connecting' | 'error' | 'connected';

class AppSocketService {
  private static _instance: AppSocketService;
  static get instance() {
    return this._instance || (this._instance = new AppSocketService());
  }

  readonly socket = io(APP_WEBSOCKET_URL, {
    autoConnect: false,
    reconnectionAttempts: 5,
    transports: ['websocket'],
  });
  private _state: AppSocketState = 'connecting';
  private connectionResolver: PromiseWithResolver<void>[] = [];

  constructor() {
    this.initListeners();
  }

  private initListeners() {
    this.socket.on('connect', () => {
      this._state = 'connected';
      this.connectionResolver.forEach((resolver) => {
        resolver.resolve();
      });
      this.connectionResolver = [];
    });
    this.socket.on('connect_error', (error) => {
      if (
        !this.socket.active ||
        ('type' in error && error.type === 'TransportError')
      ) {
        this.connectionResolver.forEach((resolver) => {
          resolver.reject(error);
        });
        this.connectionResolver = [];
      }
    });
    this.socket.on('disconnect', () => {
      if (!this.socket.active) {
        this.connectionResolver.forEach((resolver) => {
          resolver.reject(new Error('Disconnect'));
        });
        this.connectionResolver = [];
      }

      this._state = 'connecting';
    });
  }

  get state() {
    return this._state;
  }

  emit<T extends keyof WebAppWSClientToServerEvents>(
    name: T,
    ...args: Parameters<WebAppWSClientToServerEvents[T]>
  ) {
    this.socket.connect();
    if (!this.socket) {
      throw new Error("Socket hasn't been initialized");
    }

    this.socket.emit(name, ...args);
  }

  emitWithAck<T extends keyof WebAppWSClientToServerEvents>(
    name: T,
    ...args: Parameters<WebAppWSClientToServerEvents[T]>
  ): Promise<ReturnType<WebAppWSClientToServerEvents[T]>> {
    this.socket.connect();
    if (!this.socket) {
      throw new Error("Socket hasn't been initialized");
    }

    return this.socket.emitWithAck(name, ...args);
  }

  whenConnected() {
    if (this._state === 'connected') return Promise.resolve();

    const resolver = promiseWithResolver();
    this.connectionResolver.push(resolver);

    this.socket.connect();

    return resolver.promise;
  }
}

export default AppSocketService;
