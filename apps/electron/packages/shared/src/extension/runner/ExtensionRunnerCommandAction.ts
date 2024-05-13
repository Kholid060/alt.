import ExtensionWorkerScript from '/@/workers/extension.worker?worker';
import type { ExtensionRunnerProcessConstructor } from './ExtensionRunnerProcess';
import ExtensionRunnerProcess, {
  ExtensionRunnerProcessFinishReason,
} from './ExtensionRunnerProcess';
import type { BetterMessagePayload } from '@repo/shared';
import { BetterMessagePort, isObject } from '@repo/shared';
import IPCRenderer from '#packages/common/utils/IPCRenderer';
import type { MessagePortSharedCommandWindowEvents } from '#packages/common/interface/message-port-events.interface';
import { isIPCEventError } from '#packages/common/utils/helper';
import type { ExtensionCommandWorkerInitMessage } from '/@/interface/extension.interface';

class ExtensionRunnerCommandAction extends ExtensionRunnerProcess {
  private worker: Worker | null = null;
  private timeout: NodeJS.Timeout | number = -1;

  private messageChannel = new MessageChannel();
  private mainMessageChannel = new MessageChannel();

  readonly id: string;

  constructor({ id, ...options }: ExtensionRunnerProcessConstructor) {
    super(options);

    this.id = id;
    this.onCommandWindowEvents = this.onCommandWindowEvents.bind(this);
  }

  private initWorkerMessagePort() {
    const messagePort =
      BetterMessagePort.createStandalone<MessagePortSharedCommandWindowEvents>(
        'sync',
        this.messageChannel.port2,
      );

    messagePort.on('command-json:update-ui', (data) => {
      // forward to command window
      this.runner.messagePort.event.sendMessage('command-json:update-ui', data);
    });
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
    const { extensionId, timeoutMs } = this.payload;

    const manifest = await IPCRenderer.invoke(
      'database:get-extension-manifest',
      extensionId,
    );
    if (!manifest || isIPCEventError(manifest)) {
      throw new Error("Couldn't find extension manifest");
    }

    // Message port for accessing Extension APIs
    IPCRenderer.postMessage(
      'message-port:shared-extension<=>main',
      { extPortId: this.id },
      [this.mainMessageChannel.port2],
    );

    try {
      this.worker = new ExtensionWorkerScript({
        name: `${this.command.title} (${manifest.title})`,
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
          manifest,
          type: 'init',
          runnerId: this.id,
          payload: this.payload,
          command: this.command,
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
    this.messageChannel.port2.postMessage(data);
  }

  stop(): void {
    this.destroy();
    this.emit('finish', ExtensionRunnerProcessFinishReason.Stop, null);
  }

  private destroy() {
    this.worker?.terminate();
    this.worker = null;

    IPCRenderer.postMessage('message-port:delete:shared-extension<=>main', {
      extPortId: this.id,
    });

    clearTimeout(this.timeout);
  }
}

export default ExtensionRunnerCommandAction;
