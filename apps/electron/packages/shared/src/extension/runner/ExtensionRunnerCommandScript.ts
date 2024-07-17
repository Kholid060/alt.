import path from 'node:path';
import { spawn } from 'node:child_process';
import { snakeCase } from 'lodash-es';
import type { ExtensionRunnerProcessConstructor } from './ExtensionRunnerProcess';
import ExtensionRunnerProcess, {
  ExtensionRunnerProcessFinishReason,
} from './ExtensionRunnerProcess';
import { resolveFileCommand } from '/@/utils/resolve-file-command';

const ARGS_PREFIX = '__ARGS__';

class ExtensionRunnerCommandScript extends ExtensionRunnerProcess {
  readonly id: string;

  private lastMessage: string = '';
  private errorMessage: string = '';
  private controller: AbortController = new AbortController();

  constructor({ id, ...options }: ExtensionRunnerProcessConstructor) {
    super(options);

    this.id = id;

    this.onProcessExit = this.onProcessExit.bind(this);
    this.onProcessSpawn = this.onProcessSpawn.bind(this);
    this.onProcessError = this.onProcessError.bind(this);
    this.onProcessStdoutData = this.onProcessStdoutData.bind(this);
    this.onProcessStderrData = this.onProcessStderrData.bind(this);
  }

  private onProcessSpawn() {
    this.runner.messagePort.eventSync.sendMessage('command-script:message', {
      message: '',
      type: 'start',
      runnerId: this.id,
      commandTitle: this.command.title,
      commandId: this.payload.extensionId,
      extensionId: this.payload.extensionId,
    });
  }

  private onProcessError(error: Error) {
    console.error(error);
    this.runner.messagePort.eventSync.sendMessage('command-script:message', {
      type: 'error',
      runnerId: this.id,
      message: error.message,
      commandTitle: this.command.title,
      commandId: this.payload.extensionId,
      extensionId: this.payload.extensionId,
    });
  }

  private onProcessExit(code: number) {
    const isSuccess = code === 0;
    const message = isSuccess
      ? this.lastMessage
      : `Process finish with exit code ${code} \n\n ${this.errorMessage}`;

    this.runner.messagePort.eventSync.sendMessage('command-script:message', {
      message,
      runnerId: this.id,
      commandTitle: this.command.title,
      commandId: this.payload.extensionId,
      type: isSuccess ? 'finish' : 'error',
      extensionId: this.payload.extensionId,
    });

    if (isSuccess) {
      this.emit('finish', ExtensionRunnerProcessFinishReason.Done, message);
    } else {
      this.emit('error', message);
    }
  }

  private onProcessStdoutData(data: string) {
    this.lastMessage = data.toString().trim();

    this.runner.messagePort.eventSync.sendMessage('command-script:message', {
      type: 'message',
      runnerId: this.id,
      message: this.lastMessage,
      commandTitle: this.command.title,
      commandId: this.payload.extensionId,
      extensionId: this.payload.extensionId,
    });
  }

  private onProcessStderrData(chunk: string) {
    if (!this.command.extension.isLocal) return;

    this.runner.messagePort.eventSync.sendMessage('command-script:message', {
      type: 'stderr',
      runnerId: this.id,
      message: chunk.toString(),
      commandTitle: this.command.title,
      commandId: this.payload.extensionId,
      extensionId: this.payload.extensionId,
    });
  }

  async start() {
    const { launchContext, commandId } = this.payload;

    const fileCommand = await resolveFileCommand(this.commandFilePath);
    if (!fileCommand) {
      const errorMessage = `"${path.basename(commandId)}" script file is not supported`;
      this.emit('error', errorMessage);
      this.runner.messagePort.eventSync.sendMessage('command-script:message', {
        type: 'error',
        runnerId: this.id,
        message: errorMessage,
        commandTitle: this.command.title,
        commandId: this.payload.extensionId,
        extensionId: this.payload.extensionId,
      });
      return;
    }

    const env = Object.fromEntries(
      Object.entries(launchContext.args).map(([key, value]) => [
        `${ARGS_PREFIX}${snakeCase(key)}`.toUpperCase(),
        value,
      ]),
    ) as Record<string, string>;
    env['__LAUNCH_BY'] = launchContext.launchBy;

    const spawnArgs: string[] = [this.commandFilePath];
    if (fileCommand === 'sh') {
      spawnArgs.unshift('-e');
    }

    const ls = spawn(fileCommand, spawnArgs, {
      env,
      signal: this.controller.signal,
    });
    ls.addListener('exit', this.onProcessExit);
    ls.addListener('spawn', this.onProcessSpawn);
    ls.addListener('error', this.onProcessError);
    ls.stdout.addListener('data', this.onProcessStdoutData);
    ls.stderr.addListener('data', this.onProcessStderrData);
  }

  stop(): void {
    this.controller.abort();
    this.emit('finish', ExtensionRunnerProcessFinishReason.Stop, null);
  }

  onCommandWindowEvents = undefined;
}

export default ExtensionRunnerCommandScript;
