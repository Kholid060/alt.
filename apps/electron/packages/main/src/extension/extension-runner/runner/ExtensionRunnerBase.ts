import { ExtensionCommandExecutePayloadWithData } from '#packages/common/interface/extension.interface';
import EventEmitter from 'eventemitter3';

export enum ExtensionRunnerFinishReason {
  Done = 'done',
  Stop = 'stopped',
  Timeout = 'timeout',
  Terminate = 'terminate',
}

interface BaseEventData {
  runnerId: string;
  payload: ExtensionCommandExecutePayloadWithData;
}

export interface ExtensionRunnerEvents {
  message: [event: BaseEventData & { message: string }];
  error: [event: BaseEventData & { errorMessage: string }];
  finish: [
    event: BaseEventData & {
      reason: ExtensionRunnerFinishReason;
      data: unknown;
    },
  ];
}

export interface ExtensionRunnerRunOptions {
  waitUntilFinished?: boolean;
}

abstract class ExtensionRunnerBase {
  abstract readonly id: string;
  abstract readonly payload: ExtensionCommandExecutePayloadWithData;
  abstract readonly eventEmitter: EventEmitter<ExtensionRunnerEvents>;

  abstract run(options?: ExtensionRunnerRunOptions): Promise<unknown>;

  abstract stop(): void;
}

export default ExtensionRunnerBase;
