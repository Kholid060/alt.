import path from 'node:path';
import fs from 'fs-extra';
import which from 'which';
import ExtensionLoader from './ExtensionLoader';
import { spawn } from 'node:child_process';
import WindowsManager from '/@/window/WindowsManager';
import { sendIpcMessageToWindow } from '../ipc-main';
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
    { controller: AbortController; lastMessage: string }
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
    const scriptPath = ExtensionLoader.instance.getPath(
      extensionId,
      'base',
      commandId,
    );
    if (!scriptPath || !fs.existsSync(scriptPath)) {
      throw new ExtensionError(`Couldn't find "${commandId}" command`);
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

    const ls = spawn(fileCommand, [scriptPath], {
      env,
      signal: controller.signal,
    });
    ls.addListener('spawn', () => {
      this.runningScripts[scriptId] = {
        controller,
        lastMessage: '',
      };
      sencIpcMessage('command-script:message', {
        commandId,
        extensionId,
        message: '',
        type: 'start',
      });
    });
    ls.addListener('error', (error) => {
      console.error(error);
      sencIpcMessage('command-script:message', {
        commandId,
        extensionId,
        type: 'error',
        message: error.message,
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
      sencIpcMessage('command-script:message', {
        commandId,
        extensionId,
        type: isSuccess ? 'finish' : 'error',
        message: isSuccess
          ? this.runningScripts[scriptId].lastMessage
          : `Process finish with exit code ${code}`,
      });

      delete this.runningScripts[scriptId];
    });
    ls.stdout.addListener('data', (data) => {
      const message = data.toString();
      this.runningScripts[scriptId].lastMessage = message;
      sencIpcMessage('command-script:message', {
        message,
        commandId,
        extensionId,
        type: 'message',
      });
    });
  }
}

export default ExtensionCommandScriptRunner;
