import { Injectable } from '@nestjs/common';
import { BrowserExtensionService } from '/@/browser-extension/browser-extension.service';
import { OnExtensionAPI } from '/@/common/decorators/extension.decorator';
import { ExtensionApiEvent } from '../events/extension-api.event';
import { CustomError } from '#packages/common/errors/custom-errors';
import { getFileDetail } from '/@/common/utils/getFileDetail';
import { isWSAckError } from '/@/common/utils/helper';
@Injectable()
export class ExtensionBrowserApiListener {
  constructor(private browserExtension: BrowserExtensionService) {}

  @OnExtensionAPI('browser.isAvailable')
  async isBrowserAvailable(_event: ExtensionApiEvent<'browser.isAvailable'>) {
    return this.browserExtension.isBrowserConnected();
  }

  @OnExtensionAPI('browser.tabs.#actions')
  async tabActions({
    args: [detail],
  }: ExtensionApiEvent<'browser.tabs.#actions'>) {
    const result = await this.browserExtension.emitToBrowserWithAck(detail);
    if (isWSAckError(result)) {
      throw new CustomError(result.errorMessage);
    }

    return result;
  }

  @OnExtensionAPI('browser.tabs.selectFiles')
  async selectFileActiveTab({
    args: [{ browserId, timeout, files, selector, tab }],
  }: ExtensionApiEvent<'browser.tabs.selectFiles'>) {
    const resolvedFiles = await Promise.all(
      files.map(async (file) => {
        if (typeof file !== 'string') return file;

        return await getFileDetail(file);
      }),
    );

    const result = await this.browserExtension.emitToBrowserWithAck({
      name: 'tabs:select-file',
      timeout,
      browserId,
      args: [tab, selector, resolvedFiles],
    });
    if (isWSAckError(result)) {
      throw new CustomError(result.errorMessage);
    }
  }
}