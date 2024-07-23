import path from 'node:path';
import { spawn } from 'node:child_process';
import { snakeCase } from 'lodash-es';
import type { ExtensionRunnerProcessConstructor } from './ExtensionRunnerProcess';
import ExtensionRunnerProcess, {
  ExtensionRunnerProcessFinishReason,
} from './ExtensionRunnerProcess';
import { resolveFileCommand } from '/@/utils/resolve-file-command';
import { CommandLaunchBy } from '@altdot/extension';
import { ExtensionCommandExecuteScriptOptions } from '#packages/common/interface/extension.interface';

const ARGS_PREFIX = '__ARGS__';

class ExtensionRunnerCommandScript extends ExtensionRunnerProcess {
  readonly id: string;
  readonly emitEvent: boolean;

  private lastMessage: string = '';
  private allMessages: string = '';
  private errorMessage: string = '';

  private readonly controller: AbortController = new AbortController();
  private readonly scriptOptions: ExtensionCommandExecuteScriptOptions = {};

  constructor({ id, ...options }: ExtensionRunnerProcessConstructor) {
    super(options);

    this.id = id;
    this.scriptOptions = options.payload.scriptOptions ?? {};
    this.emitEvent = [CommandLaunchBy.USER, CommandLaunchBy.DEEP_LINK].includes(
      options.payload.launchContext.launchBy,
    );

    this.onProcessExit = this.onProcessExit.bind(this);
    this.onProcessSpawn = this.onProcessSpawn.bind(this);
    this.onProcessError = this.onProcessError.bind(this);
    this.onProcessStdoutData = this.onProcessStdoutData.bind(this);
    this.onProcessStderrData = this.onProcessStderrData.bind(this);
  }

  private onProcessSpawn() {
    if (!this.emitEvent) return;

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
    if (!this.emitEvent) return;

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
      ? this.scriptOptions.captureAllMessages
        ? this.allMessages
        : this.lastMessage
      : `Process finish with exit code ${code} \n\n ${this.errorMessage}`;

    if (this.emitEvent) {
      this.runner.messagePort.eventSync.sendMessage('command-script:message', {
        message,
        runnerId: this.id,
        commandTitle: this.command.title,
        commandId: this.payload.extensionId,
        type: isSuccess ? 'finish' : 'error',
        extensionId: this.payload.extensionId,
      });
    }

    if (isSuccess) {
      this.emit('finish', ExtensionRunnerProcessFinishReason.Done, message);
    } else {
      this.emit('error', message);
    }
  }

  private onProcessStdoutData(data: string) {
    this.lastMessage = data.toString().trim();

    if (this.scriptOptions.captureAllMessages) {
      this.allMessages += this.lastMessage;
    }

    if (!this.emitEvent) return;
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
    if (!this.command.extension.isLocal || !this.emitEvent) return;

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

      if (!this.emitEvent) return;
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
