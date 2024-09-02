import { Controller } from '@nestjs/common';
import { ExtensionRunnerService } from './extension-runner.service';
import type {
  IPCInvokePayload,
  IPCInvokeReturn,
  IPCSendPayload,
} from '#packages/common/interface/ipc-events.interface';
import { Ctx, Payload } from '@nestjs/microservices';
import { IPCInvoke, IPCSend } from '/@/common/decorators/ipc.decorator';
import { ExtensionRunnerExecutionService } from './extension-runner-execution.service';

@Controller()
export class ExtensionRunnerController {
  constructor(
    private extensionRunner: ExtensionRunnerService,
    private extensionExecution: ExtensionRunnerExecutionService,
  ) {}

  @IPCInvoke('extension:execute-command')
  executeCommand(
    @Payload() [payload]: IPCInvokePayload<'extension:execute-command'>,
  ) {
    return this.extensionRunner.executeCommand(payload);
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

  @IPCSend('extension:execution-message-port')
  addExecutionMessagePort(
    @Ctx() event: Electron.IpcMainEvent,
    @Payload()
    [{ extPortId }]: IPCSendPayload<'extension:execution-message-port'>,
  ) {
    this.extensionExecution.addMessagePort(event.ports[0], extPortId);
  }

  @IPCSend('extension:delete-execution-message-port')
  deleteExecutionMessagePort(
    @Payload()
    [{ extPortId }]: IPCSendPayload<'extension:delete-execution-message-port'>,
  ) {
    this.extensionExecution.deleteMessagePort(extPortId);
  }

  @IPCInvoke('user-extension')
  handleExecutionMessage(
    @Ctx() event: Electron.IpcMainInvokeEvent,
    @Payload() [payload]: IPCInvokePayload<'user-extension'>,
  ): IPCInvokeReturn<'user-extension'> {
    return this.extensionExecution.handleExecutionMessage({
      ...payload,
      sender: event,
    });
  }
}
