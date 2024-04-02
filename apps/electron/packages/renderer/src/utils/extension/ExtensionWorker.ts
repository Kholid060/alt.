import { nanoid } from 'nanoid';
import { ExtensionCommand, ExtensionManifest } from '@repo/extension-core';
import ExtensionWorkerScript from '/@/workers/extension.worker?worker';
import preloadAPI from '../preloadAPI';
import { isObject } from '@repo/shared';
import { CommandWorkerInitMessage } from '/@/interface/command.interface';
import { CommandLaunchContext } from '@repo/extension';

const MAX_COMMAND_EXECUTION_MS = 300_000; // 5 mins
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
    command,
    manifest,
    extensionId,
    events = {},
    messagePort,
    launchContext,
    timeout = MAX_COMMAND_EXECUTION_MS,
  }: {
    key: string;
    timeout?: number;
    extensionId: string;
    command: ExtensionCommand;
    messagePort?: MessagePort;
    manifest: ExtensionManifest;
    launchContext: CommandLaunchContext;
    events?: Partial<{
      onError: (worker: Worker, event: ErrorEvent) => void;
      onFinish: <T = unknown>(worker: Worker, data: T) => void;
      onMessage: (worker: Worker, event: MessageEvent) => void;
    }>;
  }): Promise<Worker | null> {
    let extensionWorker: Worker | null = null;
    let mainMessagePort: MessagePort | null = null;

    let workerTimeout: NodeJS.Timeout | null = null;

    try {
      extensionWorker = new ExtensionWorkerScript({
        name: `${extensionId}:${command.name}`,
      });
      if (!extensionWorker) return null;

      const workerId = nanoid(5);

      if (workerTimeout !== 0) {
        workerTimeout = setTimeout(() => {
          extensionWorker?.terminate();
          events.onFinish?.(extensionWorker!, undefined);
        }, timeout);
      }

      extensionWorker.onerror = (event) => {
        events.onError?.(extensionWorker!, event);
      };
      extensionWorker.onmessage = (
        event: MessageEvent<{ id: string; type: string; message: string }>,
      ) => {
        if (!isObject(event.data) || event.data?.id !== workerId) return;

        events.onMessage?.(extensionWorker!, event);

        const { type, message } = event.data ?? {};

        switch (type) {
          case 'error':
            clearTimeout(workerTimeout!);
            events.onError?.(
              extensionWorker!,
              new ErrorEvent('error', { message }),
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
        {
          key,
          manifest,
          workerId,
          type: 'init',
          commandType: command.type,
          launchContext: launchContext,
        } as CommandWorkerInitMessage,
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
}

export default ExtensionWorker;
