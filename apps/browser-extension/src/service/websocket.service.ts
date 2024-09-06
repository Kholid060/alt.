import { Socket, io } from 'socket.io-client';
import {
  APP_WEBSOCKET_PORT,
  sleep,
  type ExtensionWSClientToServerEvents,
  type ExtensionWSServerToClientEvents,
} from '@altdot/shared';
import getBrowserInfo from '../utils/getBrowserInfo';
import { websocketEventsListener } from './websocket.service-events';
import EventEmitter from 'eventemitter3';
import Browser from 'webextension-polyfill';

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

  private socket: Socket<
    ExtensionWSServerToClientEvents,
    ExtensionWSClientToServerEvents
  > | null = null;

  constructor() {
    super();
  }

  private async startConnectInterval() {
    if (this.socket?.connected) return;

    await sleep(10_000);
    if (!__IS_FIREFOX__) await Browser.runtime.getPlatformInfo();
    await this.startConnectInterval();
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
      console.log('WEBSOCKET CONNECTED');
    });
    this.socket.on('disconnect', (reason) => {
      this.startConnectInterval();
      this.emit('disconnect', reason);
    });

    this.startConnectInterval();
    websocketEventsListener(this.socket!);
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
