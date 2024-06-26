import { Controller } from '@nestjs/common';
import { IPCInvoke } from '../common/decorators/ipc.decorator';
import { Payload } from '@nestjs/microservices';
import type { IPCInvokePayload } from '#packages/common/interface/ipc-events.interface';
import { ExtensionLoaderService } from './extension-loader.service';

@Controller()
export class ExtensionLoaderController {
  constructor(private extensionLoader: ExtensionLoaderService) {}

  @IPCInvoke('extension:install')
  installExtension(
    @Payload() [extensionId]: IPCInvokePayload<'extension:install'>,
  ) {
    return this.extensionLoader.installExtension(extensionId);
  }

  @IPCInvoke('extension:delete')
  uninstallExtension(
    @Payload() [extensionId]: IPCInvokePayload<'extension:delete'>,
  ) {
    return this.extensionLoader.uninstallExtension(extensionId);
  }

  @IPCInvoke('extension:import')
  importExtension(
    @Payload() [manifestPath]: IPCInvokePayload<'extension:import'>,
  ) {
    return this.extensionLoader.importExtension(manifestPath);
  }

  @IPCInvoke('extension:reload')
  reloadExtension(
    @Payload() [extensionId]: IPCInvokePayload<'extension:reload'>,
  ) {
    return this.extensionLoader.reloadExtension(extensionId);
  }
}
