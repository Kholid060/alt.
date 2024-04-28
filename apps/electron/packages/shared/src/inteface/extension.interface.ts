import type { ExtensionCommandExecutePayload } from '#packages/common/interface/extension.interface';
import type { ExtensionCommand, ExtensionManifest } from '@repo/extension-core';

export interface ExtensionCommandWorkerInitMessage {
  type: 'init';
  workerId: string;
  command: ExtensionCommand;
  manifest: ExtensionManifest;
  payload: ExtensionCommandExecutePayload;
}
