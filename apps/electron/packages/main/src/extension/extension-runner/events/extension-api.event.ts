import { IPCUserExtensionEventsMap } from '#packages/common/interface/ipc-events.interface';
import { ExtensionExecutionEventContext } from '../extension-runner.interface';

export class ExtensionApiEvent<T extends keyof IPCUserExtensionEventsMap> {
  constructor(
    readonly context: ExtensionExecutionEventContext,
    readonly args: Parameters<IPCUserExtensionEventsMap[T]>,
  ) {}
}
