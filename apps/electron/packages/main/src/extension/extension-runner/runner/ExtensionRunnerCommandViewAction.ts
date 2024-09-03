import {
  ExtensionCommandExecutePayloadWithData,
  ExtensionCommandViewActionPayload,
} from '#packages/common/interface/extension.interface';
import { nanoid } from 'nanoid';
import ExtensionRunnerBase, {
  ExtensionRunnerEvents,
} from './ExtensionRunnerBase';
import WindowCommand from '/@/browser-window/window/WindowCommand';
import EventEmitter from 'eventemitter3';
import fs from 'fs-extra';
import { MessageChannelMain, utilityProcess } from 'electron';
import path from 'path';
import { filterAppEnv } from '../utils/filter-app-env';
import { __DIRNAME } from '/@/common/utils/constant';

class ExtensionRunnerCommandView implements ExtensionRunnerBase {
  readonly id = nanoid();

  private process: Electron.UtilityProcess | null = null;

  constructor(
    private readonly windowCommand: WindowCommand,
    readonly payload: ExtensionCommandExecutePayloadWithData,
    readonly eventEmitter: EventEmitter<ExtensionRunnerEvents>,
  ) {}

  async run() {
    let actionMessagePort: Electron.MessagePortMain | null = null;

    const viewActionFilePath = this.payload.commandFilePath + '.action.js';
    if (fs.existsSync(viewActionFilePath)) {
      const messageChannel = new MessageChannelMain();
      actionMessagePort = messageChannel.port1;
      this.process = utilityProcess.fork(
        path.join(__DIRNAME, './extension-command-view-action.worker.js'),
        [],
        { env: filterAppEnv() },
      );
      this.process.once('exit', () => {
        this.process = null;
      });
      this.process.postMessage(
        {
          type: 'start',
          payload: {
            filePath: viewActionFilePath,
          } as ExtensionCommandViewActionPayload,
        },
        [messageChannel.port2],
      );
    }

    this.windowCommand.toggleWindow(true);
    this.windowCommand.postMessage(
      'command-window:open-view',
      {
        ...this.payload,
        runnerId: this.id,
      },
      actionMessagePort ? [actionMessagePort] : [],
    );
  }

  stop() {
    this.process?.kill();
  }
}

export default ExtensionRunnerCommandView;
