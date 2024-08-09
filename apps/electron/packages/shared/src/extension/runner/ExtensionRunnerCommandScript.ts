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
import { debugLog } from '#packages/common/utils/helper';

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
    this.onProcessStdoutData = this.onProcessStdoutData.bind(this);
    this.onProcessStderrData = this.onProcessStderrData.bind(this);
  }

  private onProcessExit(code: number) {
    const isSuccess = code === 0;
    const message = isSuccess
      ? this.scriptOptions.captureAllMessages
        ? this.allMessages
        : this.lastMessage
      : `Process finish with exit code ${code} \n\n ${this.errorMessage}`;

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

    debugLog('[SCRIPT STDOUT]', this.lastMessage);
  }

  private onProcessStderrData(chunk: string) {
    this.errorMessage = chunk.toString();
  }

  async start() {
    const { launchContext, commandId } = this.payload;

    const fileCommand = await resolveFileCommand(this.commandFilePath);
    if (!fileCommand) {
      const errorMessage = `"${path.basename(commandId)}" script file is not supported`;
      this.emit('error', errorMessage);

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
