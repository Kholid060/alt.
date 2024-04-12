import path from 'node:path';
import which from 'which';
import fs from 'fs-extra';
import ExtensionLoader from './ExtensionLoader';
import { spawn } from 'node:child_process';
import WindowsManager from '/@/window/WindowsManager';
import { sendIpcMessageToWindow } from '../ipc/ipc-main';
import { snakeCase } from 'lodash-es';
import { logger } from '/@/lib/log';
import { ExtensionError } from '#packages/common/errors/custom-errors';
import type { CommandLaunchContext } from '@repo/extension';

const FILE_EXT_COMMAND_MAP: Record<string, string> = {
  '.sh': 'sh',
  '.js': 'node',
  '.py': 'python',
  '.ps1': 'powershell',
};
const ARGS_PREFIX = '__ARGS__';

class ExtensionCommandScriptRunner {
  private static _instance: ExtensionCommandScriptRunner | null = null;
  static get instance() {
    if (!this._instance) {
      this._instance = new ExtensionCommandScriptRunner();
    }

    return this._instance;
  }

  private existedCommandCache = new Set<string>();

  runningScripts: Record<
    string,
    { controller: AbortController; lastMessage: string; errorMessage: string }
  >;

  constructor() {
    this.runningScripts = {};
  }

  async runScript({
    commandId,
    extensionId,
    launchContext,
  }: {
    commandId: string;
    extensionId: string;
    launchContext: CommandLaunchContext;
  }) {
    const extension = ExtensionLoader.instance.getExtension(extensionId);
    const command = ExtensionLoader.instance.getCommand(extensionId, commandId);
    if (!command || !extension) {
      throw new ExtensionError("Couldn't find command");
    }

    const commandFilePath = ExtensionLoader.instance.getPath(
      extensionId,
      'base',
      commandId,
    );
    if (!commandFilePath || !fs.existsSync(commandFilePath)) {
      throw new ExtensionError("Couldn't find command");
    }

    const fileExt = path.extname(commandId);
    const fileCommand = FILE_EXT_COMMAND_MAP[fileExt];
    if (!fileCommand) {
      throw new ExtensionError(`"${fileExt}" is not supported`);
    }

    let isCommandExists = this.existedCommandCache.has(fileCommand);
    if (!isCommandExists) {
      isCommandExists = Boolean(await which(fileCommand, { nothrow: true }));
      if (isCommandExists) this.existedCommandCache.add(fileCommand);
    }

    const commandWindow = WindowsManager.instance.getWindow('command');
    const sencIpcMessage = sendIpcMessageToWindow(commandWindow);

    const scriptId = `${extensionId}::${commandId}`;
    const controller = new AbortController();

    const env = Object.fromEntries(
      Object.entries(launchContext.args).map(([key, value]) => [
        `${ARGS_PREFIX}${snakeCase(key)}`.toUpperCase(),
        value,
      ]),
    ) as Record<string, string>;
    env['__LAUNCH_BY'] = launchContext.launchBy;

    const spawnArgs: string[] = [commandFilePath];
    if (fileCommand === 'sh') {
      spawnArgs.unshift('-e');
    }

    const ls = spawn(fileCommand, spawnArgs, {
      env,
      signal: controller.signal,
    });
    ls.addListener('spawn', () => {
      this.runningScripts[scriptId] = {
        controller,
        lastMessage: '',
        errorMessage: '',
      };
      sencIpcMessage('command-script:message', {
        commandId,
        extensionId,
        message: '',
        type: 'start',
        commandTitle: command.title,
      });
    });
    ls.addListener('error', (error) => {
      console.error(error);
      sencIpcMessage('command-script:message', {
        commandId,
        extensionId,
        type: 'error',
        message: error.message,
        commandTitle: command.title,
      });
      delete this.runningScripts[scriptId];

      logger(
        'error',
        ['ExtensionCommandScriptRunner', 'runScript'],
        error.message,
      );
    });
    ls.addListener('exit', (code) => {
      const isSuccess = code === 0;
      const { lastMessage, errorMessage } = this.runningScripts[scriptId] ?? {};

      sencIpcMessage('command-script:message', {
        commandId,
        extensionId,
        commandTitle: command.title,
        type: isSuccess ? 'finish' : 'error',
        message: isSuccess
          ? lastMessage
          : `Process finish with exit code ${code} \n\n ${errorMessage}`,
      });

      delete this.runningScripts[scriptId];
    });
    ls.stdout.addListener('data', (data) => {
      if (!this.runningScripts[scriptId]) return;

      const message = data.toString();
      this.runningScripts[scriptId].lastMessage = message;
      sencIpcMessage('command-script:message', {
        message,
        commandId,
        extensionId,
        type: 'message',
        commandTitle: command.title,
      });
    });
    ls.stderr.addListener('data', (chunk) => {
      if (!extension.isLocal || !this.runningScripts[scriptId]) return;

      this.runningScripts[scriptId].errorMessage += `${chunk.toString()}\n`;
      sencIpcMessage('command-script:message', {
        commandId,
        extensionId,
        type: 'stderr',
        message: chunk.toString(),
        commandTitle: command.title,
      });
    });
  }
}

export default ExtensionCommandScriptRunner;
