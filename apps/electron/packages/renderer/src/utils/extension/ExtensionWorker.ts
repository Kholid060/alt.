import { nanoid } from 'nanoid';
import { ExtensionManifest } from '@repo/extension-core';
import ExtensionWorkerScript from '/@/workers/extension.worker?worker';
import preloadAPI from '../preloadAPI';

const MAX_COMMAND_EXECUTION_MS = 120_000; // 2 mins
const CREATE_MESSAGE_PORT_TIMEOUT_MS = 5000; // 5 seconds

function createMessagePort() {
  return new Promise<MessagePort>((resolve, reject) => {
    let timeout: NodeJS.Timeout | null = null;

    const eventId = nanoid(5);
    const messageListener = ({ ports }: MessageEvent) => {
      clearTimeout(timeout as NodeJS.Timeout);
      resolve(ports[0]);
    };

    // @ts-expect-error custom event
    window.addEventListener(eventId, messageListener, { once: true });

    preloadAPI.main.createMainMessagePort(eventId);

    timeout = setTimeout(() => {
      // @ts-expect-error custom event
      window.removeEventListener(eventId, messageListener);
      reject(new Error('TIMEOUT'));
    }, CREATE_MESSAGE_PORT_TIMEOUT_MS);
  });
}

class ExtensionWorker {
  private static _instance: null | ExtensionWorker = null;
  static get instance() {
    if (!this._instance) {
      this._instance = new ExtensionWorker();
    }

    return this._instance;
  }

  worker: Worker | null;

  constructor() {
    this.worker = null;
  }

  async createWorker({
    key,
    manifest,
    commandId,
    extensionId,
    events = {},
    messagePort,
    commandArgs = {},
    timeout = MAX_COMMAND_EXECUTION_MS,
  }: {
    key: string;
    timeout?: number;
    commandId: string;
    extensionId: string;
    messagePort?: MessagePort;
    manifest: ExtensionManifest;
    commandArgs?: Record<string, unknown>;
    events?: Partial<{
      onError: (worker: Worker, event: ErrorEvent) => void;
      onFinish: <T = unknown>(worker: Worker, data: T) => void;
      onMessage: (worker: Worker, event: MessageEvent) => void;
    }>;
  }) {
    let extensionWorker: Worker | null = null;
    let mainMessagePort: MessagePort | null = null;

    let workerTimeout: NodeJS.Timeout | null = null;

    try {
      extensionWorker = new ExtensionWorkerScript({
        name: `${extensionId}:${commandId}`,
      });
      if (!extensionWorker) return null;

      workerTimeout = setTimeout(() => {
        console.log('WORKER TIMEOUT');
        extensionWorker?.terminate();
        events.onFinish?.(extensionWorker!, undefined);
      }, timeout);

      extensionWorker.onerror = (event) => {
        events.onError?.(extensionWorker!, event);
      };
      extensionWorker.onmessage = (event) => {
        events.onMessage?.(extensionWorker!, event);

        switch (event.data) {
          case 'error':
            clearTimeout(workerTimeout!);
            events.onError?.(
              extensionWorker!,
              new ErrorEvent('error', { message: event.data }),
            );
            break;
          case 'finish':
            clearTimeout(workerTimeout!);
            events.onFinish?.(extensionWorker!, event.data);
            break;
        }
      };

      mainMessagePort = await createMessagePort();

      const transfer: Transferable[] = [mainMessagePort];
      if (messagePort) transfer.push(messagePort);

      extensionWorker.postMessage(
        { type: 'init', manifest, key, commandArgs },
        { transfer },
      );

      return extensionWorker;
    } catch (error) {
      console.error(error);
      extensionWorker?.terminate();
      preloadAPI.main.deleteMainMessagePort();

      clearTimeout(workerTimeout as NodeJS.Timeout);
    }

    return null;
  }

  async executeActionCommand({
    args,
    commandId,
    messagePort,
    extensionId,
  }: {
    commandId: string;
    extensionId: string;
    messagePort?: MessagePort;
    args?: Record<string, unknown>;
  }) {
    try {
      const extension = await preloadAPI.main.sendIpcMessage(
        'extension:get',
        extensionId,
      );
      if (!extension) return;
      if ('$isError' in extension) throw new Error(extension.message);

      const clearWorker = (worker?: Worker) => {
        if (worker || this.worker) console.log('CLEAR WORKER');

        worker?.terminate();

        preloadAPI.main.deleteMainMessagePort();
        this.worker?.terminate();
        this.worker = null;
      };

      const extensionWorker = await this.createWorker({
        commandId,
        extensionId,
        messagePort,
        commandArgs: args,
        key: extension.$key,
        manifest: extension.manifest,
        events: {
          onError: (worker, event) => {
            console.error(event);
            clearWorker(worker);
          },
          onFinish: (worker) => clearWorker(worker),
        },
      });
      if (!extensionWorker) return;

      this.worker = extensionWorker;
    } catch (error) {
      console.error(error);
    }
  }
}

export default ExtensionWorker;
