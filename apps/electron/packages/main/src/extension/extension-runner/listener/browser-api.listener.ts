import { Injectable } from '@nestjs/common';
import { BrowserExtensionService } from '/@/browser-extension/browser-extension.service';
import { OnExtensionAPI } from '/@/common/decorators/extension.decorator';
import { ExtensionApiEvent } from '../events/extension-api.event';
import { CustomError } from '#packages/common/errors/custom-errors';
import { getFileDetail } from '/@/common/utils/getFileDetail';
import { isWSAckError } from '/@/common/utils/helper';
import { BrowserWindowService } from '/@/browser-window/browser-window.service';
@Injectable()
export class ExtensionBrowserApiListener {
  constructor(
    private browserExtension: BrowserExtensionService,
    private browserWindow: BrowserWindowService,
  ) {}

  @OnExtensionAPI('browser.isAvailable')
  async isBrowserAvailable(_event: ExtensionApiEvent<'browser.isAvailable'>) {
    return this.browserExtension.isBrowserConnected();
  }

  @OnExtensionAPI('browser.tabs.#actions')
  async tabActions({
    args: [detail],
  }: ExtensionApiEvent<'browser.tabs.#actions'>) {
    if (detail.name === 'tabs:select-element') {
      const commandWindow = await this.browserWindow.get('command', {
        autoCreate: false,
        noThrow: true,
      });
      if (commandWindow) {
        const result = await commandWindow.tempHideWindow(() =>
          this.browserExtension.emitToBrowserWithAck(detail),
        );
        if (isWSAckError(result)) {
          throw new CustomError(result.errorMessage);
        }

        return result;
      }
    }

    const result = await this.browserExtension.emitToBrowserWithAck(detail);
    if (isWSAckError(result)) {
      throw new CustomError(result.errorMessage);
    }

    return result;
  }

  @OnExtensionAPI('browser.tabs.selectFiles')
  async selectFileActiveTab({
    args: [{ browserId, timeout, files, selector, tab, options }],
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
      args: [tab, selector, resolvedFiles, options],
    });
    if (isWSAckError(result)) {
      throw new CustomError(result.errorMessage);
    }
  }
}
