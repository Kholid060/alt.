import { nanoid } from 'nanoid';
import { snakeCase } from 'lodash-es';
import ExtensionRunnerBase, {
  ExtensionRunnerEvents,
  ExtensionRunnerFinishReason,
  ExtensionRunnerRunOptions,
} from './ExtensionRunnerBase';
import {
  ExtensionCommandExecutePayloadWithData,
  ExtensionCommandExecuteScriptOptions,
} from '#packages/common/interface/extension.interface';
import { CommandLaunchBy } from '@altdot/extension';
import { ChildProcessWithoutNullStreams, spawn } from 'child_process';
import path from 'path';
import EventEmitter from 'eventemitter3';
import { debugLog } from '#packages/common/utils/helper';
import { resolveFileCommand } from '../utils/resolve-file-command';
import { filterAppEnv } from '../utils/filter-app-env';
import { promiseWithResolver } from '@altdot/shared';

const ARGS_PREFIX = '__ARGS__';

class ExtensionRunnerCommandScript implements ExtensionRunnerBase {
  readonly id = nanoid();
  readonly emitEvent: boolean;

  private resolver: PromiseWithResolvers<unknown> | null = null;

  private childProcess: ChildProcessWithoutNullStreams | null = null;

  private lastMessage: string = '';
  private allMessages: string = '';
  private errorMessage: string = '';
  private readonly commandFilePath: string;

  private readonly controller: AbortController = new AbortController();
  private readonly scriptOptions: ExtensionCommandExecuteScriptOptions = {};

  constructor(
    readonly payload: ExtensionCommandExecutePayloadWithData,
    readonly eventEmitter: EventEmitter<ExtensionRunnerEvents>,
  ) {
    this.commandFilePath = payload.commandFilePath;
    this.scriptOptions = payload.scriptOptions ?? {};
    this.emitEvent = [CommandLaunchBy.USER, CommandLaunchBy.DEEP_LINK].includes(
      payload.launchContext.launchBy,
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
      if (this.resolver) this.resolver.resolve(message);

      this.eventEmitter.emit('finish', {
        data: message,
        runnerId: this.id,
        payload: this.payload,
        reason: ExtensionRunnerFinishReason.Done,
      });
    } else {
      if (this.resolver) this.resolver.reject(message);

      this.eventEmitter.emit('error', {
        runnerId: this.id,
        payload: this.payload,
        errorMessage: message,
      });
    }

    this.childProcess = null;
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

  async run(options?: ExtensionRunnerRunOptions) {
    const { launchContext, commandId } = this.payload;

    const fileCommand = await resolveFileCommand(this.commandFilePath);
    if (!fileCommand) {
      const errorMessage = `"${path.basename(commandId)}" script file is not supported`;
      this.eventEmitter.emit('error', {
        errorMessage,
        runnerId: this.id,
        payload: this.payload,
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

    if (options?.waitUntilFinished) {
      this.resolver = promiseWithResolver();
    }

    this.childProcess = spawn(fileCommand, spawnArgs, {
      signal: this.controller.signal,
      env: { ...filterAppEnv(), ...env },
    });
    this.childProcess.addListener('exit', this.onProcessExit);
    this.childProcess.stdout.addListener('data', this.onProcessStdoutData);
    this.childProcess.stderr.addListener('data', this.onProcessStderrData);

    return this.resolver?.promise ?? Promise.resolve(null);
  }

  stop(): void {
    this.controller.abort();
  }
}

export default ExtensionRunnerCommandScript;
