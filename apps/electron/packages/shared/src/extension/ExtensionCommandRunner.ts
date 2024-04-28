import type ExtensionRunnerProcess from './runner/ExtensionRunnerProcess';
import type { ExtensionCommandExecutePayload } from '#packages/common/interface/extension.interface';
import IPCRenderer from '#common/utils/IPCRenderer';
import ExtensionRunnerCommandAction from './runner/ExtensionRunnerCommandAction';
import { isIPCEventError } from '../utils/helper';
import { nanoid } from 'nanoid';
import EventEmitter from 'eventemitter3';
import { MESSAGE_PORT_CHANNEL_IDS } from '#packages/common/utils/constant/constant';

interface ExtensionCommandRunnerEvents {
  'ui:search-change': string;
}

class ExtensionCommandRunner {
  private static _instance: ExtensionCommandRunner;

  static get instance() {
    return this._instance || (this._instance = new ExtensionCommandRunner());
  }

  private commandWindowMessagePort: MessagePort | null = null;
  private runningCommands: Map<string, ExtensionRunnerProcess> = new Map();

  event: EventEmitter<ExtensionCommandRunnerEvents>;

  constructor() {
    this.event = new EventEmitter();
  }

  private createCommandWindowMessagePort() {
    const { port1, port2 } = new MessageChannel();
    this.commandWindowMessagePort = port2;
    IPCRenderer.postMessage(
      'message-port:port-bridge',
      MESSAGE_PORT_CHANNEL_IDS.sharedWithCommand,
      [port1],
    );

    port2.start();
    port2.addEventListener('message', (message) => {
      console.log(message);
    });
  }

  async execute(payload: ExtensionCommandExecutePayload) {
    if (!this.commandWindowMessagePort) {
      this.createCommandWindowMessagePort();
    }

    const command = await IPCRenderer.invoke('database:get-command', {
      commandId: payload.commandId,
      extensionId: payload.extensionId,
    });
    if (!command || isIPCEventError(command)) {
      throw new Error("Couldn't find the extension command data");
    }

    const runnerId = nanoid(5);

    let commandRunner: ExtensionRunnerProcess | null = null;
    switch (command.type) {
      case 'action':
        commandRunner = new ExtensionRunnerCommandAction({
          command,
          payload,
          runner: this,
          id: runnerId,
        });
        break;
    }
    if (!commandRunner) {
      throw new Error(`"${command.type}" doesn't have runner`);
    }

    commandRunner.on('error', () => {
      this.runningCommands.delete(runnerId);
    });
    commandRunner.on('finish', console.log);

    await commandRunner.start();

    this.runningCommands.set(runnerId, commandRunner);
  }
}

export default ExtensionCommandRunner;
