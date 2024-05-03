import type ExtensionRunnerProcess from './runner/ExtensionRunnerProcess';
import type { ExtensionCommandExecutePayloadWithData } from '#packages/common/interface/extension.interface';
import IPCRenderer from '#common/utils/IPCRenderer';
import ExtensionRunnerCommandAction from './runner/ExtensionRunnerCommandAction';
import { nanoid } from 'nanoid';
import { MESSAGE_PORT_CHANNEL_IDS } from '#packages/common/utils/constant/constant';
import { debugLog } from '#packages/common/utils/helper';
import { MessagePortRenderer } from '#common/utils/message-port-renderer';
import type { MessagePortSharedCommandWindowEvents } from '#packages/common/interface/message-port-events.interface';
import type { SetRequired } from 'type-fest';
import type { ExtensionRunnerProcessConstructor } from './runner/ExtensionRunnerProcess';
import ExtensionRunnerCommandScript from './runner/ExtensionRunnerCommandScript';

class ExtensionCommandRunner {
  private static _instance: ExtensionCommandRunner;

  static get instance() {
    return this._instance || (this._instance = new ExtensionCommandRunner());
  }

  private runners: Map<string, ExtensionRunnerProcess> = new Map();
  private commandWindowEventListeners: Map<
    string,
    SetRequired<
      ExtensionRunnerProcess,
      'onCommandWindowEvents'
    >['onCommandWindowEvents']
  > = new Map();

  messagePort: MessagePortRenderer<MessagePortSharedCommandWindowEvents>;

  constructor() {
    this.messagePort = new MessagePortRenderer();
  }

  private createCommandWindowMessagePort() {
    if (this.messagePort.hasPort) return;

    const { port1, port2 } = new MessageChannel();

    debugLog('Sending MessagePort to Command window');
    IPCRenderer.postMessage(
      'message-port:port-bridge',
      MESSAGE_PORT_CHANNEL_IDS.sharedWithCommand,
      [port1],
    );

    port2.addEventListener('message', ({ data }) => {
      this.commandWindowEventListeners.forEach((listener) => {
        listener(data);
      });
    });
    this.messagePort.changePort(port2);

    port2.start();
  }

  sendMessageToCommandWindow() {}

  async execute({
    command,
    commandFilePath,
    ...payload
  }: ExtensionCommandExecutePayloadWithData) {
    const runnerId = nanoid(5);

    try {
      this.createCommandWindowMessagePort();

      let commandRunner: ExtensionRunnerProcess | null = null;
      const commandRunnerPayload: ExtensionRunnerProcessConstructor = {
        command,
        payload,
        runner: this,
        id: runnerId,
        commandFilePath,
      };

      switch (command.type) {
        case 'action':
        case 'view:json':
          commandRunner = new ExtensionRunnerCommandAction(
            commandRunnerPayload,
          );
          break;
        case 'script':
          commandRunner = new ExtensionRunnerCommandScript(
            commandRunnerPayload,
          );
          break;
      }
      if (!commandRunner) {
        throw new Error(`"${command.type}" doesn't have runner`);
      }

      commandRunner.once('error', (message) => {
        this.destroyRunningCommand(runnerId);
        debugLog(
          `"${command.title}" command error:`,
          message,
          this.runners.size,
        );
      });
      commandRunner.once('finish', (reason, data) => {
        this.destroyRunningCommand(runnerId);
        debugLog(
          `"${command.title}" command finish:`,
          { reason, data },
          this.runners.size,
        );
      });

      if (commandRunner.onCommandWindowEvents) {
        this.commandWindowEventListeners.set(
          runnerId,
          commandRunner.onCommandWindowEvents,
        );
      }

      this.runners.set(runnerId, commandRunner);

      await commandRunner.start();

      return { id: runnerId, runner: commandRunner };
    } catch (error) {
      this.destroyRunningCommand(runnerId);
      throw error;
    }
  }

  stop(runnerId: string) {
    const runningCommand = this.runners.get(runnerId);
    if (!runningCommand) return;

    runningCommand.stop();
  }

  private destroyRunningCommand(runnerId: string) {
    this.runners.delete(runnerId);
    this.commandWindowEventListeners.delete(runnerId);
  }
}

export default ExtensionCommandRunner;
