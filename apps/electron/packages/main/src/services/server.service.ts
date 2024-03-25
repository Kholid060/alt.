import type { ChildProcess } from 'child_process';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

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

  private serverProcess: ChildProcess | null = null;

  constructor() {}

  init() {
    this.serverProcess = spawn('node', [SERVER_FILE_PATH]);
    this.serverProcess.stderr?.on('data', (chunk) => {
      console.log('SERVER (stderr) => ', chunk.toString());
    });
    this.serverProcess.stdout?.on('data', (chunk) => {
      console.log('SERVER (stdout) => ', chunk.toString());
    });
  }
}

export default ServerService;
