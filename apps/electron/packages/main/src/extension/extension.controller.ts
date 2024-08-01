import { Controller } from '@nestjs/common';
import { ExtensionService } from './extension.service';
import { IPCInvoke, IPCSend } from '../common/decorators/ipc.decorator';
import { Payload } from '@nestjs/microservices';
import type {
  IPCInvokePayload,
  IPCInvokeReturn,
  IPCSendPayload,
} from '#packages/common/interface/ipc-events.interface';
import { ExtensionQueryService } from './extension-query.service';

@Controller()
export class ExtensionController {
  constructor(
    private extensionService: ExtensionService,
    private extensionQuery: ExtensionQueryService,
  ) {}

  @IPCInvoke('extension:execute-command')
  executeCommand(
    @Payload() [payload]: IPCInvokePayload<'extension:execute-command'>,
  ) {
    return this.extensionService.executeCommand(payload);
  }

  @IPCSend('extension:command-exec-change')
  onExecutionChange(
    @Payload() payload: IPCSendPayload<'extension:command-exec-change'>,
  ) {
    return this.extensionService.handleExecutionChange(...payload);
  }

  @IPCInvoke('extension:stop-running-command')
  stopRunningCommand(
    @Payload() [runnerId]: IPCInvokePayload<'extension:stop-running-command'>,
  ) {
    return this.extensionService.stopCommandExecution(runnerId);
  }

  @IPCInvoke('extension:list-running-commands')
  listRunningCommands() {
    return this.extensionService.getRunningCommands();
  }

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

  @IPCSend('extension:stop-execute-command')
  stopCommandExecution(
    @Payload() [runnerId]: IPCSendPayload<'extension:stop-execute-command'>,
  ) {
    this.extensionService.stopCommandExecution(runnerId);
  }

  @IPCInvoke('database:update-extension-command')
  async updateCommand(
    @Payload()
    [
      extensionId,
      commandId,
      payload,
    ]: IPCInvokePayload<'database:update-extension-command'>,
  ): IPCInvokeReturn<'database:update-extension-command'> {
    await this.extensionService.updateCommand(
      { commandId, extensionId },
      payload,
    );
  }
}
