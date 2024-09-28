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
import { MessageChannelMain, MessagePortMain, utilityProcess } from 'electron';
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

  private initViewAction(): Promise<null | MessagePortMain> {
    const viewActionFilePath = this.payload.commandFilePath + '.action.js';
    if (!fs.existsSync(viewActionFilePath)) return Promise.resolve(null);

    const resolver = Promise.withResolvers<MessagePortMain>();
    const messageChannel = new MessageChannelMain();

    this.process = utilityProcess.fork(
      path.join(__DIRNAME, './extension-command-view-action.worker.js'),
      [],
      { env: filterAppEnv() },
    );
    this.process.once('exit', () => {
      this.process = null;
    });
    this.process.once('spawn', () => {
      if (!this.process) return;

      this.process.postMessage(
        {
          type: 'start',
          payload: {
            filePath: viewActionFilePath,
          } as ExtensionCommandViewActionPayload,
        },
        [messageChannel.port2],
      );
      resolver.resolve(messageChannel.port1);
    });

    return resolver.promise;
  }

  async run() {
    const actionMessagePort = await this.initViewAction();

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
