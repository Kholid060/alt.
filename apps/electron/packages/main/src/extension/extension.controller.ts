import { Controller } from '@nestjs/common';
import { IPCInvoke } from '../common/decorators/ipc.decorator';
import { Payload } from '@nestjs/microservices';
import type {
  IPCInvokePayload,
  IPCInvokeReturn,
} from '#packages/common/interface/ipc-events.interface';
import { ExtensionQueryService } from './extension-query.service';
import { getExtensionPlatform } from '../common/utils/helper';
import { APIService } from '../api/api.service';

@Controller()
export class ExtensionController {
  constructor(
    private apiService: APIService,
    private extensionQuery: ExtensionQueryService,
  ) {}

  @IPCInvoke('database:get-extension')
  getExtension(
    @Payload() [extensionId]: IPCInvokePayload<'database:get-extension'>,
  ) {
    return this.extensionQuery.get(extensionId);
  }

  @IPCInvoke('database:get-extension-exists')
  extensionExists(
    @Payload() [extensionId]: IPCInvokePayload<'database:get-extension-exists'>,
  ): IPCInvokeReturn<'database:get-extension-exists'> {
    return this.extensionQuery.exists(extensionId);
  }

  @IPCInvoke('database:update-extension')
  async updateExtension(
    @Payload()
    [extensionId, value]: IPCInvokePayload<'database:update-extension'>,
  ): IPCInvokeReturn<'database:update-extension'> {
    await this.extensionQuery.update(extensionId, value);
  }

  @IPCInvoke('database:get-extension-list')
  async listExtensions(
    @Payload()
    [extensionId]: IPCInvokePayload<'database:get-extension-list'>,
  ): IPCInvokeReturn<'database:get-extension-list'> {
    return this.extensionQuery.list(extensionId);
  }

  @IPCInvoke('database:get-extension-manifest')
  async getExtensionManifest(
    @Payload()
    [extensionId]: IPCInvokePayload<'database:get-extension-manifest'>,
  ): IPCInvokeReturn<'database:get-extension-manifest'> {
    return this.extensionQuery.getManifest(extensionId);
  }

  @IPCInvoke('database:get-extension-creds')
  async listExtensionWithCreds(): IPCInvokeReturn<'database:get-extension-creds'> {
    return this.extensionQuery.listCredentials();
  }

  @IPCInvoke('database:get-extension-exists-arr')
  async existsArr(
    @Payload() [ids]: IPCInvokePayload<'database:get-extension-exists-arr'>,
  ): IPCInvokeReturn<'database:get-extension-exists-arr'> {
    return this.extensionQuery.existsArr(ids);
  }

  @IPCInvoke('extension:get-platform')
  async getExtensionPlatform(): IPCInvokeReturn<'extension:get-platform'> {
    return getExtensionPlatform();
  }

  @IPCInvoke('extension:fetch-extension-highlight')
  async getExtensionHighlight(
    @Payload()
    [ids]: IPCInvokePayload<'extension:fetch-extension-highlight'>,
  ): IPCInvokeReturn<'extension:fetch-extension-highlight'> {
    return this.apiService.extensions.getHighlights(ids);
  }
}
