import type { ExtensionCommandExecutePayload } from '#common/interface/extension.interface';
import type { DatabaseExtensionCommandWithExtension } from '#packages/main/src/interface/database.interface';
import { EventEmitter } from 'eventemitter3';
import type ExtensionCommandRunner from '../ExtensionCommandRunner';
import type { BetterMessagePayload } from '@alt-dot/shared';

export enum ExtensionRunnerProcessFinishReason {
  Done = 'done',
  Stop = 'stopped',
  Timeout = 'timeout',
  Terminate = 'terminate',
}

export interface ExtensionRunnerProcessEvents {
  message: [message: string];
  error: [errorMessage: string];
  finish: [reason: ExtensionRunnerProcessFinishReason, data: unknown];
}

export interface ExtensionRunnerProcessConstructor {
  id: string;
  commandFilePath: string;
  runner: ExtensionCommandRunner;
  payload: ExtensionCommandExecutePayload;
  command: DatabaseExtensionCommandWithExtension;
}

abstract class ExtensionRunnerProcess extends EventEmitter<ExtensionRunnerProcessEvents> {
  commandFilePath: string;
  runner: ExtensionCommandRunner;
  payload: ExtensionCommandExecutePayload;
  command: DatabaseExtensionCommandWithExtension;

  abstract id: string;

  constructor({
    runner,
    command,
    payload,
    commandFilePath,
  }: Omit<ExtensionRunnerProcessConstructor, 'id'>) {
    super();

    this.runner = runner;
    this.payload = payload;
    this.command = command;
    this.commandFilePath = commandFilePath;
  }

  abstract start(): Promise<void> | void;

  abstract stop(): void;

  abstract onCommandWindowEvents?(data: BetterMessagePayload): void;
}

export default ExtensionRunnerProcess;
