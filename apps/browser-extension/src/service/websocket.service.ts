import { Socket, io } from 'socket.io-client';
import {
  APP_WEBSOCKET_PORT,
  type ExtensionWSClientToServerEvents,
  type ExtensionWSServerToClientEvents,
} from '@altdot/shared';
import getBrowserInfo from '../utils/getBrowserInfo';
import { websocketEventsListener } from './websocket.service-events';
import EventEmitter from 'eventemitter3';

interface WSEvent {
  connect: [];
  disconnect: [reason: Socket.DisconnectReason];
}

class WebsocketService extends EventEmitter<WSEvent> {
  private static _instance: WebsocketService | null = null;
  static get instance() {
    if (!this._instance) {
      this._instance = new WebsocketService();
    }
    return this._instance;
  }

  socket: Socket<
    ExtensionWSServerToClientEvents,
    ExtensionWSClientToServerEvents
  > | null = null;

  constructor() {
    super();
  }

  async init() {
    if (this.socket) return;

    const browserInfo = await getBrowserInfo();

    this.socket = io(`ws://localhost:${APP_WEBSOCKET_PORT}/extensions`, {
      auth: { browserInfo },
      transports: ['websocket'],
    });
    this.socket.on('connect', () => {
      this.emit('connect');
      websocketEventsListener(this.socket!);

      console.log('WEBSOCKET CONNECTED');
    });
    this.socket.on('disconnect', (reason) => {
      this.emit('disconnect', reason);
    });
  }

  tryConnect() {
    if (!this.socket || this.socket.connected) return;

    this.socket.connect();
  }

  emitEvent<T extends keyof ExtensionWSClientToServerEvents>(
    name: T,
    ...args: Parameters<ExtensionWSClientToServerEvents[T]>
  ) {
    if (!this.socket) {
      throw new Error("Socket hasn't been initialized");
    }

    this.socket.emit(name, ...args);
  }
}

export default WebsocketService;
