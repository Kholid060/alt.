import { Controller } from '@nestjs/common';
import { BrowserExtensionService } from './browser-extension.service';
import { IPCInvoke } from '../common/decorators/ipc.decorator';
import { Payload } from '@nestjs/microservices';
import type { IPCInvokePayload } from '#packages/common/interface/ipc-events.interface';
import { BrowserExtensionActionService } from './browser-extension-action.service';

@Controller()
export class BrowserExtensionController {
  constructor(
    private browserExtension: BrowserExtensionService,
    private browserExtensionAction: BrowserExtensionActionService,
  ) {}

  @IPCInvoke('browser:get-active-tab')
  getActiveTab(
    @Payload() [browserId]: IPCInvokePayload<'browser:get-active-tab'>,
  ) {
    return this.browserExtension.getActiveTab(browserId);
  }

  @IPCInvoke('browser:get-connected-browsers')
  getConnectedBrowsers() {
    return this.browserExtension.getConnectedBrowsers();
  }

  @IPCInvoke('browser:get-focused')
  getFocusedBrowser() {
    return this.browserExtension.getFocused();
  }

  @IPCInvoke('browser:new-tab')
  newBrowserTab(
    @Payload() [browserId, url]: IPCInvokePayload<'browser:new-tab'>,
  ) {
    return this.browserExtensionAction.openNewTab(browserId, url);
  }

  @IPCInvoke('browser:select-files')
  selectFiles(
    @Payload() [detail, options]: IPCInvokePayload<'browser:select-files'>,
  ) {
    return this.browserExtensionAction.selectFile(detail, options);
  }

  @IPCInvoke('browser:actions')
  emitBrowserActions(@Payload() [detail]: IPCInvokePayload<'browser:actions'>) {
    return this.browserExtensionAction.emitActions(detail);
  }
}
