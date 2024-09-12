import { Injectable } from '@nestjs/common';
import { BrowserExtensionService } from './browser-extension.service';
import { ExtensionBrowserTabContext } from '#packages/common/interface/extension.interface';
import { IPCInvokePayload } from '#packages/common/interface/ipc-events.interface';
import { CustomError } from '#packages/common/errors/custom-errors';
import { getFileDetail } from '../common/utils/getFileDetail';
import { isWSAckError } from '../common/utils/helper';
import { BrowserSelectFileOptions } from '@altdot/shared';

@Injectable()
export class BrowserExtensionActionService {
  constructor(private browserExtension: BrowserExtensionService) {}

  async openNewTab(
    browserId: string,
    url: string,
  ): Promise<ExtensionBrowserTabContext> {
    const tab = await this.browserExtension.emitToBrowserWithAck({
      browserId,
      args: [url],
      name: 'tabs:create-new',
    });
    if (isWSAckError(tab)) throw new Error(tab.errorMessage);

    return {
      browserId,
      url: tab.url,
      tabId: tab.id,
      title: tab.title,
    };
  }

  async selectFile(
    {
      paths,
      tabId,
      selector,
      browserId,
    }: IPCInvokePayload<'browser:select-files'>[0],
    options: BrowserSelectFileOptions = {},
  ) {
    const files = await Promise.all(paths.map(getFileDetail));
    const result = await this.browserExtension.emitToBrowserWithAck({
      browserId,
      name: 'tabs:select-file',
      args: [{ tabId }, { selector }, files, options],
    });
    if (isWSAckError(result)) {
      throw new CustomError(result.errorMessage);
    }

    return result;
  }

  async emitActions({
    args,
    name,
    timeout,
    browserId,
  }: IPCInvokePayload<'browser:actions'>[0]) {
    const result = await this.browserExtension.emitToBrowserWithAck({
      args,
      name,
      timeout,
      browserId,
    });
    if (isWSAckError(result)) {
      throw new CustomError(result.errorMessage);
    }

    return result;
  }
}
