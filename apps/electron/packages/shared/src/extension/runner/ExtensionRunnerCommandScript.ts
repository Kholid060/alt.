import path from 'node:path';
import which from 'which';
import { spawn } from 'node:child_process';
import { snakeCase } from 'lodash-es';
import type { ExtensionRunnerProcessConstructor } from './ExtensionRunnerProcess';
import ExtensionRunnerProcess, {
  ExtensionRunnerProcessFinishReason,
} from './ExtensionRunnerProcess';

const FILE_EXT_COMMAND_MAP: Record<string, string> = {
  '.sh': 'sh',
  '.js': 'node',
  '.mjs': 'node',
  '.cjs': 'node',
  '.py': 'python',
  '.pyi': 'python',
  '.ps1': 'powershell',
};
const ARGS_PREFIX = '__ARGS__';

const existedCommandCache = new Set<string>();

class ExtensionRunnerCommandScript extends ExtensionRunnerProcess {
  readonly id: string;

  private lastMessage: string = '';
  private errorMessage: string = '';
  private controller: AbortController = new AbortController();

  constructor({ id, ...options }: ExtensionRunnerProcessConstructor) {
    super(options);

    this.id = id;
  }

  async start() {
    const { launchContext, commandId, extensionId } = this.payload;

    const fileExt = path.extname(commandId);
    const fileCommand = FILE_EXT_COMMAND_MAP[fileExt];
    if (!fileCommand) {
      this.emit('error', `"${fileExt}" script file is not supported`);
      return;
    }

    let isCommandExists = existedCommandCache.has(fileCommand);
    if (!isCommandExists) {
      isCommandExists = Boolean(await which(fileCommand, { nothrow: true }));
      if (isCommandExists) existedCommandCache.add(fileCommand);
      else throw new Error(`"${fileExt}" is not supported on this machine`);
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
    ls.addListener('spawn', () => {
      this.runner.messagePort.event.sendMessage('command-script:message', {
        commandId,
        extensionId,
        message: '',
        type: 'start',
        runnerId: this.id,
        commandTitle: this.command.title,
      });
    });
    ls.addListener('error', (error) => {
      console.error(error);
      this.runner.messagePort.event.sendMessage('command-script:message', {
        commandId,
        extensionId,
        type: 'error',
        runnerId: this.id,
        message: error.message,
        commandTitle: this.command.title,
      });
    });
    ls.addListener('exit', (code) => {
      const isSuccess = code === 0;
      const message = isSuccess
        ? this.lastMessage
        : `Process finish with exit code ${code} \n\n ${this.errorMessage}`;

      this.runner.messagePort.event.sendMessage('command-script:message', {
        message,
        commandId,
        extensionId,
        runnerId: this.id,
        commandTitle: this.command.title,
        type: isSuccess ? 'finish' : 'error',
      });

      if (isSuccess) {
        this.emit('finish', ExtensionRunnerProcessFinishReason.Done, message);
      } else {
        this.emit('error', message);
      }
    });
    ls.stdout.addListener('data', (data) => {
      this.lastMessage = data.toString().trim();

      this.runner.messagePort.event.sendMessage('command-script:message', {
        commandId,
        extensionId,
        type: 'message',
        runnerId: this.id,
        message: this.lastMessage,
        commandTitle: this.command.title,
      });
    });
    ls.stderr.addListener('data', (chunk) => {
      if (!this.command.extension.isLocal) return;

      this.runner.messagePort.event.sendMessage('command-script:message', {
        commandId,
        extensionId,
        type: 'stderr',
        runnerId: this.id,
        message: chunk.toString(),
        commandTitle: this.command.title,
      });
    });
  }

  stop(): void {
    this.controller.abort();
    this.emit('finish', ExtensionRunnerProcessFinishReason.Stop, null);
  }

  onCommandWindowEvents = undefined;
}

export default ExtensionRunnerCommandScript;
