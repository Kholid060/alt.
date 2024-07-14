import type { ExtensionCommandExecutePayload } from '#packages/common/interface/extension.interface';
import { ExtensionCommand } from '@altdot/extension/dist/extension-manifest';

export interface ExtensionCommandWorkerInitMessage {
  type: 'init';
  runnerId: string;
  command: ExtensionCommand;
  payload: ExtensionCommandExecutePayload;
}
