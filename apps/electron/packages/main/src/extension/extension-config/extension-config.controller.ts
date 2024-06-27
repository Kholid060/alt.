import { Controller } from '@nestjs/common';
import { IPCInvoke } from '/@/common/decorators/ipc.decorator';
import { ExtensionConfigService } from './extension-config.service';
import { Payload } from '@nestjs/microservices';
import type { IPCInvokePayload } from '#packages/common/interface/ipc-events.interface';

@Controller()
export class ExtensionConfigController {
  constructor(private extensionConfig: ExtensionConfigService) {}

  @IPCInvoke('extension:is-config-inputted')
  isConfigInputted(
    @Payload()
    [extensionId, commandId]: IPCInvokePayload<'extension:is-config-inputted'>,
  ) {
    return this.extensionConfig.isInputted(extensionId, commandId);
  }

  @IPCInvoke('database:get-extension-config')
  getExtensionConfig(
    @Payload()
    [detail]: IPCInvokePayload<'database:get-extension-config'>,
  ) {
    return this.extensionConfig.getConfigWithSchema(detail);
  }

  @IPCInvoke('database:insert-extension-config')
  insertExtensionConfig(
    @Payload()
    [value]: IPCInvokePayload<'database:insert-extension-config'>,
  ) {
    return this.extensionConfig.insertConfig(value);
  }

  @IPCInvoke('database:update-extension-config')
  updateExtensionConfig(
    @Payload()
    [configId, value]: IPCInvokePayload<'database:update-extension-config'>,
  ) {
    return this.extensionConfig.updateConfig(configId, value);
  }
}
