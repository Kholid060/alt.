import type {
  PromiseMessagePayload,
  PromiseMessagePortResult,
} from '#packages/common/utils/PromiseMessagePort';
import type { ServerPortEvent } from '#packages/common/interface/server-port-event.interface';

class MessagePortService {
  private static _instance: MessagePortService | null = null;
  static get instance() {
    if (!this._instance) {
      this._instance = new MessagePortService();
    }

    return this._instance;
  }

  private messagePort: Electron.MessagePortMain | null = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private messageHandlers: Map<string, (...args: any[]) => any> = new Map();

  constructor() {
    this._onMessagePortEvent = this._onMessagePortEvent.bind(this);
  }

  private async _onMessagePortEvent({ data }: { data: PromiseMessagePayload }) {
    if (!this.messagePort) {
      throw new Error("Server hasn't been initialized");
    }

    const messageHandler = this.messageHandlers.get(data.name);
    if (!messageHandler) return;

    const payload: PromiseMessagePortResult = {
      result: [],
      name: data.messageId || data.name,
    };

    try {
      payload.result = await messageHandler(...data.args);
      this.messagePort.postMessage(payload);
    } catch (error) {
      payload.error = true;
      payload.errorMessage = (error as Error).message;

      this.messagePort.postMessage(payload);
    }
  }

  init(messagePort: Electron.MessagePortMain) {
    this.messagePort = messagePort;
    this.messagePort.addListener('message', this._onMessagePortEvent);

    this.messagePort.start();
  }

  sendMessage<T extends keyof ServerPortEvent>(
    name: T,
    ...args: Parameters<ServerPortEvent[T]>
  ) {
    if (!this.messagePort) {
      throw new Error("Server hasn't been initialized");
    }

    this.messagePort.postMessage({
      name,
      result: args,
    } as PromiseMessagePortResult);
  }

  onMessage<K extends keyof ServerPortEvent>(
    name: K,
    callback: (
      ...args: Parameters<ServerPortEvent[K]>
    ) => ReturnType<ServerPortEvent[K]>,
  ) {
    this.messageHandlers.set(name, callback);
  }
}

export default MessagePortService;
