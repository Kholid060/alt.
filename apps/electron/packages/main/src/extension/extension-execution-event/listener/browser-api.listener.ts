import { Injectable } from '@nestjs/common';
import { BrowserExtensionService } from '/@/browser-extension/browser-extension.service';
import { OnExtensionAPI } from '/@/common/decorators/extension.decorator';
import { ExtensionApiEvent } from '../events/extension-api.event';
import { CustomError } from '#packages/common/errors/custom-errors';
import { isWSAckError } from '/@/utils/extension/ExtensionBrowserElementHandle';
import ExtensionAPI from '@alt-dot/extension-core/types/extension-api';
import { ExtensionBrowserTabContext } from '#packages/common/interface/extension.interface';
import {
  ExtensionWSServerToClientEvents,
  AllButFirstOrLast,
  AllButLast,
  Last,
  WSAckErrorResult,
} from '@alt-dot/shared';
import ExtensionWSNamespace from '/@/services/websocket/ws-namespaces/extensions.ws-namespace';
import { getFileDetail } from '/@/utils/getFileDetail';
import { BrowserWindowService } from '/@/browser-window/browser-window.service';

const elementHandlerWSEventMap = {
  type: 'tabs:type',
  click: 'tabs:click',
  press: 'tabs:press',
  keyUp: 'tabs:key-up',
  select: 'tabs:select',
  getText: 'tabs:get-text',
  getHTML: 'tabs:get-html',
  keyDown: 'tabs:key-down',
  mouseUp: 'tabs:mouse-up',
  mouseDown: 'tabs:mouse-down',
  selectFile: 'tabs:select-file',
  getAttributes: 'tabs:get-attributes',
  setAttributes: 'tabs:set-attributes',
} as const;

const getElementSelector = (
  selector: ExtensionAPI.browser.ElementSelector,
): ExtensionAPI.browser.ElementSelectorDetail =>
  typeof selector === 'string' ? { selector } : selector;

type ElementHandlerWSEventMap = typeof elementHandlerWSEventMap;

@Injectable()
export class ExtensionBrowserApiListener {
  constructor(
    private browserWindow: BrowserWindowService,
    private browserExtension: BrowserExtensionService,
  ) {}

  private async elementHandle<
    T extends keyof ElementHandlerWSEventMap,
    P extends Parameters<
      ExtensionWSServerToClientEvents[ElementHandlerWSEventMap[T]]
    >,
  >(
    browserCtx: ExtensionBrowserTabContext,
    name: T,
    ...args: AllButFirstOrLast<P>
  ) {
    if (!browserCtx) {
      throw new CustomError("Couldn't find active tab browser");
    }

    const result = await ExtensionWSNamespace.instance.emitToBrowserWithAck({
      browserId: browserCtx.browserId,
      name: elementHandlerWSEventMap[name],
      args: [{ tabId: browserCtx.tabId }, ...args] as unknown as AllButLast<P>,
    });
    if (isWSAckError(result)) {
      throw new CustomError(result.errorMessage);
    }

    return result as Exclude<Parameters<Last<P>>[0], WSAckErrorResult>;
  }

  @OnExtensionAPI('browser.activeTab.reload')
  async reloadActiveTab({
    context: { browserCtx },
  }: ExtensionApiEvent<'browser.activeTab.reload'>) {
    if (!browserCtx) {
      throw new CustomError("Couldn't find active tab browser");
    }

    const { browserId, tabId } = browserCtx;
    const result = await this.browserExtension.emitToBrowserWithAck({
      browserId,
      name: 'tabs:reload',
      args: [{ tabId }],
    });
    if (isWSAckError(result)) {
      throw new CustomError(result.errorMessage);
    }
  }

  @OnExtensionAPI('browser.activeTab.click')
  async clickActiveTab({
    context: { browserCtx },
    args: [selector],
  }: ExtensionApiEvent<'browser.activeTab.click'>) {
    return this.elementHandle(
      browserCtx,
      'click',
      getElementSelector(selector),
    );
  }

  @OnExtensionAPI('browser.activeTab.mouseDown')
  async mouseDownActiveTab({
    context: { browserCtx },
    args: [selector],
  }: ExtensionApiEvent<'browser.activeTab.mouseDown'>) {
    return this.elementHandle(
      browserCtx,
      'mouseDown',
      getElementSelector(selector),
    );
  }

  @OnExtensionAPI('browser.activeTab.mouseUp')
  async mouseUpActiveTab({
    context: { browserCtx },
    args: [selector],
  }: ExtensionApiEvent<'browser.activeTab.mouseUp'>) {
    return this.elementHandle(
      browserCtx,
      'mouseUp',
      getElementSelector(selector),
    );
  }

  @OnExtensionAPI('browser.activeTab.type')
  async typeActiveTab({
    context: { browserCtx },
    args: [selector, text, options],
  }: ExtensionApiEvent<'browser.activeTab.type'>) {
    return this.elementHandle(
      browserCtx,
      'type',
      getElementSelector(selector),
      text,
      options ?? {},
    );
  }

  @OnExtensionAPI('browser.activeTab.getText')
  async getTextActiveTab({
    context: { browserCtx },
    args: [selector, options],
  }: ExtensionApiEvent<'browser.activeTab.getText'>) {
    return this.elementHandle(
      browserCtx,
      'getText',
      getElementSelector(selector ?? 'html'),
      options,
    );
  }

  @OnExtensionAPI('browser.activeTab.getHTML')
  async getHTMLActiveTab({
    context: { browserCtx },
    args: [selector, options],
  }: ExtensionApiEvent<'browser.activeTab.getHTML'>) {
    return this.elementHandle(
      browserCtx,
      'getHTML',
      getElementSelector(selector ?? 'html'),
      options ?? {},
    );
  }

  @OnExtensionAPI('browser.activeTab.select')
  async selectActiveTab({
    context: { browserCtx },
    args: [selector, ...values],
  }: ExtensionApiEvent<'browser.activeTab.select'>) {
    return this.elementHandle(
      browserCtx,
      'select',
      getElementSelector(selector),
      values,
    );
  }

  @OnExtensionAPI('browser.activeTab.keyDown')
  async keyDownActiveTab({
    context: { browserCtx },
    args: [selector, ...args],
  }: ExtensionApiEvent<'browser.activeTab.keyDown'>) {
    return this.elementHandle(
      browserCtx,
      'keyDown',
      getElementSelector(selector),
      ...args,
    );
  }

  @OnExtensionAPI('browser.activeTab.keyUp')
  async keyUpActiveTab({
    context: { browserCtx },
    args: [selector, ...args],
  }: ExtensionApiEvent<'browser.activeTab.keyUp'>) {
    return this.elementHandle(
      browserCtx,
      'keyUp',
      getElementSelector(selector),
      ...args,
    );
  }

  @OnExtensionAPI('browser.activeTab.press')
  async pressActiveTab({
    context: { browserCtx },
    args: [selector, ...args],
  }: ExtensionApiEvent<'browser.activeTab.press'>) {
    return this.elementHandle(
      browserCtx,
      'press',
      getElementSelector(selector),
      ...args,
    );
  }

  @OnExtensionAPI('browser.activeTab.getAttributes')
  async getAttributesActiveTab({
    context: { browserCtx },
    args: [selector, attrNames],
  }: ExtensionApiEvent<'browser.activeTab.getAttributes'>) {
    return this.elementHandle(
      browserCtx,
      'getAttributes',
      getElementSelector(selector),
      attrNames ?? null,
    );
  }

  @OnExtensionAPI('browser.activeTab.selectFile')
  async selectFileActiveTab({
    context: { browserCtx },
    args: [selector, files],
  }: ExtensionApiEvent<'browser.activeTab.selectFile'>) {
    const resolvedFiles = await Promise.all(
      files.map(async (file) => {
        if (typeof file !== 'string') return file;

        return await getFileDetail(file);
      }),
    );

    return this.elementHandle(
      browserCtx,
      'selectFile',
      getElementSelector(selector),
      resolvedFiles,
    );
  }

  @OnExtensionAPI('browser.activeTab.elementExists')
  async elementExistsActiveTab({
    context: { browserCtx },
    args: [selector, multiple],
  }: ExtensionApiEvent<'browser.activeTab.elementExists'>) {
    if (!browserCtx) {
      throw new CustomError("Couldn't find active tab browser");
    }

    const { browserId, tabId } = browserCtx;
    const result = await ExtensionWSNamespace.instance.emitToBrowserWithAck({
      browserId,
      name: 'tabs:element-exists',
      args: [{ tabId }, { selector }, multiple ?? false],
    });
    if (isWSAckError(result)) {
      throw new CustomError(result.errorMessage);
    }

    return result;
  }

  // @ts-expect-error the element handle object created on the invoker
  @OnExtensionAPI('browser.activeTab.waitForSelector')
  async waitForSelectorActiveTab({
    context: { browserCtx },
    args: [selector, options],
  }: ExtensionApiEvent<'browser.activeTab.waitForSelector'>) {
    const timeout = Math.max(+(options?.timeout || 90_000), 10_000);
    if (!browserCtx) {
      throw new CustomError("Couldn't find active tab browser");
    }

    const { browserId, tabId } = browserCtx;
    const result = await ExtensionWSNamespace.instance.emitToBrowserWithAck({
      timeout,
      browserId,
      name: 'tabs:wait-for-selector',
      args: [{ tabId }, { selector }, { timeout, ...(options ?? {}) }],
    });
    if (isWSAckError(result)) {
      throw new CustomError(result.errorMessage);
    }
  }

  @OnExtensionAPI('browser.activeTab.selectElement')
  async selectElementActiveTab({
    context: { browserCtx },
    args: [options],
  }: ExtensionApiEvent<'browser.activeTab.selectElement'>) {
    if (!browserCtx) {
      throw new CustomError("Couldn't find active tab browser");
    }

    const selectFile = async () => {
      const result = await ExtensionWSNamespace.instance.emitToBrowserWithAck({
        browserId,
        timeout: 300_000, // 5 minutes
        name: 'tabs:select-element',
        args: [{ tabId }, options ?? {}],
      });
      if (isWSAckError(result)) {
        throw new CustomError(result.errorMessage);
      }

      return result;
    };

    const { browserId, tabId } = browserCtx;
    const windowCommand = await this.browserWindow.get('command', {
      noThrow: true,
      autoCreate: false,
    });
    const selectedElement = await (windowCommand
      ? windowCommand.tempHideWindow(() => selectFile())
      : selectFile());

    return selectedElement;
  }
}
