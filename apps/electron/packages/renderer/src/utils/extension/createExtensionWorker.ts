import { nanoid } from 'nanoid';
import { ExtensionManifest } from '@repo/extension-core';
import ExtensionWorker from '/@/workers/extension.worker?worker';
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

    // @ts-expect-error expected!!!
    window.addEventListener(eventId, messageListener, { once: true });

    preloadAPI.main.createMainMessagePort(eventId);

    timeout = setTimeout(() => {
      // @ts-expect-error expected!!!
      window.removeEventListener(eventId, messageListener);
      reject(new Error('TIMEOUT'));
    }, CREATE_MESSAGE_PORT_TIMEOUT_MS);
  });
}

async function createExtensionWorker({
  key,
  manifest,
  commandId,
  extensionId,
  events = {},
  commandArgs = {},
  timeout = MAX_COMMAND_EXECUTION_MS,
}: {
  key: string;
  timeout?: number;
  commandId: string;
  extensionId: string;
  manifest: ExtensionManifest;
  commandArgs?: Record<string, unknown>;
  events?: Partial<{
    onError: (worker: Worker, event: ErrorEvent) => void;
    onFinish: <T = unknown>(worker: Worker, data: T) => void;
    onMessage: (worker: Worker, event: MessageEvent) => void;
  }>;
}) {
  let extensionWorker: Worker | null = null;
  let messagePort: MessagePort | null = null;

  let workerTimeout: NodeJS.Timeout | null = null;

  try {
    extensionWorker = new ExtensionWorker({
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

    messagePort = await createMessagePort();
    extensionWorker.postMessage(
      { type: 'init', manifest, key, commandArgs },
      { transfer: [messagePort] },
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

export default createExtensionWorker;
