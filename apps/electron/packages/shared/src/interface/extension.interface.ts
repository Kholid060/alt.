import type { ExtensionCommandExecutePayload } from '#packages/common/interface/extension.interface';
import type { ExtensionCommand } from '@alt-dot/extension-core';

export interface ExtensionCommandWorkerInitMessage {
  type: 'init';
  runnerId: string;
  command: ExtensionCommand;
  payload: ExtensionCommandExecutePayload;
}
