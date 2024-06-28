import { Controller } from '@nestjs/common';
import { ExtensionExecutionEventService } from './extension-execution-event.service';
import { IPCInvoke, IPCSend } from '/@/common/decorators/ipc.decorator';
import { Ctx, Payload } from '@nestjs/microservices';
import type {
  IPCInvokePayload,
  IPCInvokeReturn,
  IPCSendPayload,
} from '#packages/common/interface/ipc-events.interface';

@Controller()
export class ExtensionExecutionEventController {
  constructor(
    private extensionExecutionEvent: ExtensionExecutionEventService,
  ) {}

  @IPCSend('extension:execution-message-port')
  addExecutionMessagePort(
    @Ctx() event: Electron.IpcMainEvent,
    @Payload()
    [{ extPortId }]: IPCSendPayload<'extension:execution-message-port'>,
  ) {
    this.extensionExecutionEvent.addMessagePort(event.ports[0], extPortId);
  }

  @IPCSend('extension:delete-execution-message-port')
  deleteExecutionMessagePort(
    @Payload()
    [{ extPortId }]: IPCSendPayload<'extension:delete-execution-message-port'>,
  ) {
    this.extensionExecutionEvent.deleteMessagePort(extPortId);
  }

  @IPCInvoke('user-extension')
  handleExecutionMessage(
    @Ctx() event: Electron.IpcMainInvokeEvent,
    @Payload() [payload]: IPCInvokePayload<'user-extension'>,
  ): IPCInvokeReturn<'user-extension'> {
    return this.extensionExecutionEvent.handleExecutionMessage({
      ...payload,
      sender: event,
    });
  }
}
