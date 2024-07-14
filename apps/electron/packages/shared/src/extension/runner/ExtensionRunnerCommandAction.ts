import ExtensionWorkerScript from '/@/workers/extension.worker?worker';
import type { ExtensionRunnerProcessConstructor } from './ExtensionRunnerProcess';
import ExtensionRunnerProcess, {
  ExtensionRunnerProcessFinishReason,
} from './ExtensionRunnerProcess';
import type { BetterMessagePayload } from '@altdot/shared';
import { generateRandomString, isObject } from '@altdot/shared';
import IPCRenderer from '#packages/common/utils/IPCRenderer';
import type { ExtensionCommandWorkerInitMessage } from '/@/interface/extension.interface';

class ExtensionRunnerCommandAction extends ExtensionRunnerProcess {
  private worker: Worker | null = null;
  private timeout: NodeJS.Timeout | number = -1;

  private messageChannel = new MessageChannel();
  private mainMessageChannel = new MessageChannel();

  private asyncMessageIds = new Map<string, string>();

  readonly id: string;

  constructor({ id, ...options }: ExtensionRunnerProcessConstructor) {
    super(options);

    this.id = id;
    this.onCommandWindowEvents = this.onCommandWindowEvents.bind(this);
  }

  private initWorkerMessagePort() {
    // forward message to command window
    this.messageChannel.port2.onmessage = ({ data }) => {
      if (!data) return;

      if (data?.type === 'send' && data.isSync) {
        this.runner.messagePort.eventSync.sendMessage(data.name, ...data.args);
      } else {
        const messageId = `promise::${generateRandomString(5)}`;
        this.asyncMessageIds.set(messageId, data.messageId);
        this.runner.messagePort.eventAsync.sendMessage(
          { name: data.name, messageId },
          ...data.args,
        );
      }
    };
    this.messageChannel.port2.start();
  }

  private onWorkerMessage(
    event: MessageEvent<{ id: string; type: string; message: string }>,
  ) {
    if (!isObject(event.data)) return;

    const { type, message } = event.data ?? {};
    switch (type) {
      case 'error':
        this.emit('error', message);
        this.destroy();
        break;
      case 'finish':
        this.emit('finish', ExtensionRunnerProcessFinishReason.Done, message);
        this.destroy();
        break;
    }
  }

  private onWorkerError(event: ErrorEvent) {
    this.emit('error', event.error.message);
    this.destroy();
  }

  async start() {
    const { timeoutMs } = this.payload;

    // Message port for accessing Extension APIs
    IPCRenderer.postMessage(
      'extension:execution-message-port',
      { extPortId: this.id },
      [this.mainMessageChannel.port2],
    );

    try {
      this.worker = new ExtensionWorkerScript({
        name: `${this.command.title} (${this.command.extension.title})`,
      });

      if (typeof timeoutMs === 'number' && timeoutMs !== 0) {
        this.timeout = setTimeout(() => {
          this.destroy();
          this.emit('finish', ExtensionRunnerProcessFinishReason.Timeout, null);
        }, timeoutMs);
      }

      this.worker.onerror = this.onWorkerError.bind(this);
      this.worker.onmessage = this.onWorkerMessage.bind(this);

      this.initWorkerMessagePort();

      this.worker.postMessage(
        {
          type: 'init',
          runnerId: this.id,
          payload: this.payload,
          command: this.command,
          browserCtx: this.payload.browserCtx,
        } as ExtensionCommandWorkerInitMessage,
        {
          transfer: [this.mainMessageChannel.port1, this.messageChannel.port1],
        },
      );
    } catch (error) {
      console.error(error);
      this.emit('error', (error as Error).message);
      this.destroy();
    }
  }

  onCommandWindowEvents(data: BetterMessagePayload) {
    if (data.type === 'result' && this.asyncMessageIds.has(data.name)) {
      data.name = this.asyncMessageIds.get(data.name)!;
    }

    this.messageChannel.port2.postMessage(data);
  }

  stop(): void {
    this.destroy();
    this.emit('finish', ExtensionRunnerProcessFinishReason.Stop, null);
  }

  private destroy() {
    this.worker?.terminate();
    this.worker = null;

    IPCRenderer.postMessage('extension:delete-execution-message-port', {
      extPortId: this.id,
    });

    clearTimeout(this.timeout);
  }
}

export default ExtensionRunnerCommandAction;
