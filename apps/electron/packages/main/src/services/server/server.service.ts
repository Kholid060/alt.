import type { UtilityProcess } from 'electron';
import { MessageChannelMain, utilityProcess } from 'electron';
import { fileURLToPath } from 'url';
import type { ServerPortEvent } from '#packages/common/interface/server-port-event.interface';
import PromiseMessagePort from '#common/utils/PromiseMessagePort';
import './server-service-event';
import { initServerServiceEventListener } from './server-service-event';

const SERVER_FILE_PATH = fileURLToPath(
  new URL('./../../server/dist/main.js', import.meta.url),
);

class ServerService {
  private static _instance: ServerService | null = null;

  static get instance() {
    if (!this._instance) {
      this._instance = new ServerService();
    }

    return this._instance;
  }

  private serverProcess: UtilityProcess | null = null;

  messagePort: PromiseMessagePort<ServerPortEvent> | null = null;

  constructor() {
    this.messagePortListener = this.messagePortListener.bind(this);
  }

  init() {
    const { port1, port2 } = new MessageChannelMain();
    this.messagePort = new PromiseMessagePort(port2);

    this.serverProcess = utilityProcess.fork(SERVER_FILE_PATH, []);
    this.serverProcess.postMessage('init', [port1]);

    this.serverProcess.stderr?.on('data', (chunk) => {
      console.log('SERVER (stderr) => ', chunk.toString());
    });
    this.serverProcess.stdout?.on('data', (chunk) => {
      console.log('SERVER (stdout) => ', chunk.toString());
    });

    initServerServiceEventListener(this.messagePort);
  }

  messagePortListener({ data }: Electron.MessageEvent) {
    console.log('message', data);
  }
}

export default ServerService;
