import { Socket, io } from 'socket.io-client';
import type {
  ExtensionWSClientToServerEvents,
  ExtensionWSServerToClientEvents,
} from '@repo/shared';
import getBrowserInfo from '../utils/getBrowserInfo';
import { websocketEventsListener } from './websocket.service-events';

class WebsocketService {
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

  async init() {
    const browserInfo = await getBrowserInfo();

    await new Promise<void>((resolve) => {
      this.socket = io('ws://localhost:4567/extensions', {
        auth: { browserInfo },
        transports: ['websocket'],
      });
      this.socket.on('connect', () => {
        resolve();
        websocketEventsListener(this.socket!);
        console.log('WEBSOCKET CONNECTED');
      });
    });
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
