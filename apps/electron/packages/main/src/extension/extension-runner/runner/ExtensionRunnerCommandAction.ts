import { ExtensionCommandExecutePayloadWithData } from '#packages/common/interface/extension.interface';
import { utilityProcess } from 'electron';
import ExtensionRunnerBase, {
  ExtensionRunnerEvents,
  ExtensionRunnerFinishReason,
  ExtensionRunnerRunOptions,
} from './ExtensionRunnerBase';
import { nanoid } from 'nanoid';
import path from 'path';
import { __DIRNAME } from '/@/common/utils/constant';
import {
  isObject,
  PromiseWithResolver,
  promiseWithResolver,
} from '@altdot/shared';
import EventEmitter from 'eventemitter3';
import { filterAppEnv } from '../utils/filter-app-env';

class ExtensionRunnerCommandAction implements ExtensionRunnerBase {
  readonly id = nanoid();

  private process: Electron.UtilityProcess | null = null;

  constructor(
    readonly payload: ExtensionCommandExecutePayloadWithData,
    readonly eventEmitter: EventEmitter<ExtensionRunnerEvents>,
    private readonly port: {
      main: Electron.MessagePortMain;
      renderer: Electron.MessagePortMain;
    },
  ) {}

  stop() {
    this.process?.kill();
  }

  run(options?: ExtensionRunnerRunOptions) {
    this.process = utilityProcess.fork(
      path.join(__DIRNAME, './extension-command-action.worker.js'),
      [],
      { env: filterAppEnv() },
    );
    this.process.postMessage({ type: 'start', payload: this.payload }, [
      this.port.main,
      this.port.renderer,
    ]);

    let promise: Promise<unknown> = Promise.resolve(this.id);
    let resolver: PromiseWithResolver<unknown> | null = null;

    if (options?.waitUntilFinished) {
      resolver = promiseWithResolver();
      promise = resolver.promise;
    }

    this.process.once('exit', () => {
      if (resolver) resolver.resolve(null);

      this.process = null;
      this.port.renderer.close();
    });
    this.process.addListener('message', (event) => {
      if (!isObject(event)) return;

      if (event.type === 'finish') {
        if (resolver) resolver.resolve(event.value);
        this.eventEmitter.emit('finish', {
          data: null,
          runnerId: this.id,
          payload: this.payload,
          reason: ExtensionRunnerFinishReason.Done,
        });
        this.process?.kill();
      } else if (event.type === 'error') {
        this.eventEmitter.emit('error', {
          runnerId: this.id,
          payload: this.payload,
          errorMessage: event.message as string,
        });
      }
    });

    return promise;
  }
}

export default ExtensionRunnerCommandAction;
