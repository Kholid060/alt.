import {
  IPCEvents,
  IPCSendEventRendererToMain,
} from '#packages/common/interface/ipc-events.interface';
import { isIPCEventError } from '#packages/common/utils/helper';
import { WorkflowRunnerMessagePort } from '../../interfaces/workflow-runner.interface';

class WorkflowRunnerIPC {
  constructor(private readonly messagePort: WorkflowRunnerMessagePort) {}

  async invoke<T extends keyof IPCEvents>(
    name: T,
    ...args: Parameters<IPCEvents[T]>
  ): Promise<ReturnType<IPCEvents[T]>> {
    const result = await this.messagePort.async.sendMessage(
      'ipc:invoke',
      name,
      args,
    );
    if (isIPCEventError(result)) throw new Error(result.message);

    return result as ReturnType<IPCEvents[T]>;
  }

  send<T extends keyof IPCSendEventRendererToMain>(
    name: T,
    ...args: IPCSendEventRendererToMain[T]
  ) {
    this.messagePort.sync.sendMessage('ipc:send', name, args);
  }
}

export default WorkflowRunnerIPC;
