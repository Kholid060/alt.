import { Controller } from '@nestjs/common';
import { ExtensionErrorService } from './extension-error.service';
import { IPCInvoke } from '/@/common/decorators/ipc.decorator';
import { Payload } from '@nestjs/microservices';
import type {
  IPCInvokePayload,
  IPCInvokeReturn,
} from '#packages/common/interface/ipc-events.interface';

@Controller()
export class ExtensionErrorController {
  constructor(private extensionError: ExtensionErrorService) {}

  @IPCInvoke('database:get-extension-errors-list')
  listErrorByExtension(
    @Payload()
    [extensionId]: IPCInvokePayload<'database:get-extension-errors-list'>,
  ): IPCInvokeReturn<'database:get-extension-errors-list'> {
    return this.extensionError.listErrorsByExtension(extensionId);
  }

  @IPCInvoke('database:delete-extension-errors')
  async deleteErrors(
    @Payload()
    [ids]: IPCInvokePayload<'database:delete-extension-errors'>,
  ): IPCInvokeReturn<'database:delete-extension-errors'> {
    await this.extensionError.deleteErrors(ids);
  }
}
