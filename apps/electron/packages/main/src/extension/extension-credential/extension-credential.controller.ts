import { Controller } from '@nestjs/common';
import { ExtensionCredentialService } from './extension-credential.service';
import { IPCInvoke } from '/@/common/decorators/ipc.decorator';
import { Payload } from '@nestjs/microservices';
import type {
  IPCInvokePayload,
  IPCInvokeReturn,
} from '#packages/common/interface/ipc-events.interface';

@Controller()
export class ExtensionCredentialController {
  constructor(private extensionCredential: ExtensionCredentialService) {}

  @IPCInvoke('database:update-extension-credential')
  async updateCredential(
    @Payload()
    [id, payload]: IPCInvokePayload<'database:update-extension-credential'>,
  ): IPCInvokeReturn<'database:update-extension-credential'> {
    await this.extensionCredential.updateCredential(id, payload);
  }

  @IPCInvoke('database:insert-extension-credential')
  async insertCredential(
    @Payload()
    [payload]: IPCInvokePayload<'database:insert-extension-credential'>,
  ): IPCInvokeReturn<'database:insert-extension-credential'> {
    const [value] = await this.extensionCredential.insertCredential(payload);
    return value.id;
  }

  @IPCInvoke('database:get-extension-credential-list')
  listPagination(
    @Payload()
    [payload]: IPCInvokePayload<'database:get-extension-credential-list'>,
  ): IPCInvokeReturn<'database:get-extension-credential-list'> {
    return this.extensionCredential.listCredentialPagination(payload);
  }

  @IPCInvoke('database:delete-extension-credential')
  async deleteCredential(
    @Payload()
    [id]: IPCInvokePayload<'database:delete-extension-credential'>,
  ): IPCInvokeReturn<'database:delete-extension-credential'> {
    await this.extensionCredential.deleteCredential(id);
  }

  @IPCInvoke('database:get-extension-credential-list-detail')
  getCredentialDetail(
    @Payload()
    [
      id,
      mask,
    ]: IPCInvokePayload<'database:get-extension-credential-list-detail'>,
  ): IPCInvokeReturn<'database:get-extension-credential-list-detail'> {
    return this.extensionCredential.getCredentialDetail(id, mask);
  }
}
