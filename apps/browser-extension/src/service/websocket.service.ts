import { Socket, io } from 'socket.io-client';
import type {
  ExtensionWSClientToServerEvents,
  ExtensionWSServerToClientEvents,
} from '@repo/shared';

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

  init() {
    return new Promise<void>((resolve) => {
      this.socket = io('ws://localhost:4567/extensions', {
        transports: ['websocket'],
      });
      this.socket.on('connect', () => {
        resolve();
        console.log('WEBSOCKET CONNECTED');
      });
      console.log(this.socket);
    });
  }

  sendEvent<T extends keyof ExtensionWSClientToServerEvents>(
    name: T,
    ...args: Parameters<ExtensionWSClientToServerEvents[T]>
  ) {
    if (!this.socket) {
      throw new Error("Socket hasn't been initialized");
    }

    this.socket.send(name, ...args);
  }
}

export default WebsocketService;
