import type { ExtensionCommandExecutePayload } from '#packages/common/interface/extension.interface';
import type { ExtensionCommand } from '@repo/extension-core';

export interface ExtensionCommandWorkerInitMessage {
  type: 'init';
  runnerId: string;
  command: ExtensionCommand;
  payload: ExtensionCommandExecutePayload;
}
