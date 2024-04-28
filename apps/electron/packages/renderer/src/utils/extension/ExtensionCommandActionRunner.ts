import ExtensionWorkerScript from '/@/workers/extension.worker?worker';
import { ExtensionCommand, ExtensionManifest } from '@repo/extension-core';
import { EventEmitter } from 'eventemitter3';
import { CommandWorkerInitMessage } from '/@/interface/command.interface';
import preloadAPI from '../preloadAPI';
import { isObject } from '@repo/shared';
import { nanoid } from 'nanoid/non-secure';
import { ExtensionCommandExecutePayload } from '#packages/common/interface/extension.interface';

const MAX_COMMAND_EXECUTION_MS = 900_000; // 15 mins
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

export enum CommandActionRunnerFinishReason {
  Done = 'done',
  Timeout = 'timeout',
  Terminate = 'terminate',
}

export interface CommandActionRunnerEvents {
  error: [workerId: string, errorMessage: string];
  message: [workerId: string, event: MessageEvent];
  finish: [
    workerId: string,
    detail: { result: unknown; reason: CommandActionRunnerFinishReason },
  ];
}

export type CommandActionRunnerListener<
  T extends keyof CommandActionRunnerEvents,
> = (...args: CommandActionRunnerEvents[T]) => void;

interface WorkerData {
  id: string;
  worker: Worker;
  command: ExtensionCommand;
  timeout: NodeJS.Timeout | null;
  payload: ExtensionCommandExecutePayload;
}

class ExtensionCommandActionRunner extends EventEmitter<CommandActionRunnerEvents> {
  private static _instance: ExtensionCommandActionRunner | null = null;

  static get instance() {
    if (!this._instance) {
      this._instance = new ExtensionCommandActionRunner();
    }

    return this._instance;
  }

  private workers: Map<string, WorkerData> = new Map();

  constructor() {
    super();
  }

  getWorker(workerId: string) {
    return this.workers.get(workerId);
  }

  async execute({
    payload,
    manifest,
    messagePort,
    timeout = MAX_COMMAND_EXECUTION_MS,
  }: {
    timeout?: number;
    messagePort?: MessagePort;
    manifest: ExtensionManifest;
    payload: ExtensionCommandExecutePayload;
  }): Promise<WorkerData | null> {
    const workerId = `${payload.extensionId}:${payload.commandId}`;
    if (this.workers.has(workerId)) {
      throw new Error(`"${payload.commandId}" alread running`);
    }

    const command = manifest.commands.find(
      (command) => command.name === payload.commandId,
    );
    if (!command) {
      throw new Error("Couldn't find command");
    }

    try {
      const commandWorker = new ExtensionWorkerScript({
        name: workerId,
      });
      if (!commandWorker) return null;

      let workerTimeout: NodeJS.Timeout | null = null;
      if (workerTimeout !== 0) {
        workerTimeout = setTimeout(() => {
          this.terminateWorker(workerId);
          this.emit('finish', workerId, {
            reason: CommandActionRunnerFinishReason.Timeout,
            result: null,
          });
        }, timeout);
      }

      const workerData = {
        payload,
        command,
        id: workerId,
        worker: commandWorker,
        timeout: workerTimeout,
      };
      this.workers.set(workerId, workerData);

      commandWorker.onerror = (event) => {
        this.emit('error', workerId, event.error.message);
        this.terminateWorker(workerId);
      };
      commandWorker.onmessage = (
        event: MessageEvent<{ id: string; type: string; message: string }>,
      ) => {
        if (!isObject(event.data) || event.data?.id !== workerId) return;

        this.emit('message', workerId, event);

        const { type, message } = event.data ?? {};
        switch (type) {
          case 'error':
            this.emit('error', workerId, message);
            this.terminateWorker(workerId);
            break;
          case 'finish':
            this.emit('finish', workerId, {
              result: message,
              reason: CommandActionRunnerFinishReason.Done,
            });
            break;
        }
      };

      const mainMessagePort = await createMessagePort();

      const transfer: Transferable[] = [mainMessagePort];
      if (messagePort) transfer.push(messagePort);

      commandWorker.postMessage(
        {
          payload,
          command,
          workerId,
          manifest,
          type: 'init',
        } as CommandWorkerInitMessage,
        { transfer },
      );

      return workerData;
    } catch (error) {
      console.error(error);
      this.terminateWorker(workerId);

      return null;
    }
  }

  stopExecution(workerId: string) {
    const isWorkerTerminated = this.terminateWorker(workerId);
    if (!isWorkerTerminated) return;

    this.emit('finish', workerId, {
      result: null,
      reason: CommandActionRunnerFinishReason.Terminate,
    });
  }

  private terminateWorker(workerId: string) {
    const workerData = this.workers.get(workerId);
    if (!workerData) return false;

    if (workerData.timeout) clearTimeout(workerData.timeout);

    workerData.worker.terminate();
    preloadAPI.main.deleteMainMessagePort();

    this.workers.delete(workerId);

    return true;
  }
}

export default ExtensionCommandActionRunner;
