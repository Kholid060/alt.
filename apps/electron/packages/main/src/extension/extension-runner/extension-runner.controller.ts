import { Controller } from '@nestjs/common';
import { ExtensionRunnerService } from './extension-runner.service';
import type {
  IPCInvokePayload,
  IPCSendPayload,
} from '#packages/common/interface/ipc-events.interface';
import { Payload } from '@nestjs/microservices';
import { IPCInvoke, IPCSend } from '/@/common/decorators/ipc.decorator';

@Controller()
export class ExtensionRunnerController {
  constructor(private extensionRunner: ExtensionRunnerService) {}

  @IPCInvoke('extension:execute-command')
  executeCommand(
    @Payload() [payload]: IPCInvokePayload<'extension:execute-command'>,
  ) {
    return this.extensionRunner.executeCommand(payload);
  }

  @IPCSend('extension:command-exec-change')
  onExecutionChange(
    @Payload() payload: IPCSendPayload<'extension:command-exec-change'>,
  ) {
    return this.extensionRunner.handleExecutionChange(...payload);
  }

  @IPCInvoke('extension:stop-running-command')
  stopRunningCommand(
    @Payload() [runnerId]: IPCInvokePayload<'extension:stop-running-command'>,
  ) {
    return this.extensionRunner.stopCommandExecution(runnerId);
  }

  @IPCInvoke('extension:list-running-commands')
  listRunningCommands() {
    return this.extensionRunner.getRunningCommands();
  }

  @IPCSend('extension:stop-execute-command')
  stopCommandExecution(
    @Payload() [runnerId]: IPCSendPayload<'extension:stop-execute-command'>,
  ) {
    this.extensionRunner.stopCommandExecution(runnerId);
  }
}
