import Browser from 'webextension-polyfill';
import { injectContentHandlerScript } from '../utils/background-content-utils';
import RuntimeMessage from '../utils/RuntimeMessage';
import {
  BrowserGetTextOptions,
  KeyboardBrowserTypeOptions,
} from '@repo/shared';

interface TabTarget {
  tabId: number;
  frameId?: number;
}

class TabService {
  static reload(tabId: number) {
    return Browser.tabs.reload(tabId);
  }

  static async click({ tabId, frameId = 0 }: TabTarget, selector: string) {
    await injectContentHandlerScript(tabId);
    await RuntimeMessage.instance.sendMessageToTab({
      tabId,
      frameId,
      args: [selector],
      name: 'element:click',
    });
  }

  static async type(
    { tabId, frameId = 0 }: TabTarget,
    {
      selector,
      text,
      options,
    }: {
      selector: string;
      text: string;
      options?: Partial<KeyboardBrowserTypeOptions>;
    },
  ) {
    await injectContentHandlerScript(tabId);
    await RuntimeMessage.instance.sendMessageToTab({
      tabId,
      frameId,
      name: 'element:keyboard-type',
      args: [selector, text, options],
    });
  }

  static async getText(
    { tabId, frameId = 0 }: TabTarget,
    selector?: string,
    options?: Partial<BrowserGetTextOptions>,
  ) {
    const getTextOptions: BrowserGetTextOptions = {
      onlyVisibleText: true,
      ...(options ?? {}),
    };
    await injectContentHandlerScript(tabId);

    return await RuntimeMessage.instance.sendMessageToTab({
      tabId,
      frameId,
      name: 'element:get-text',
      args: [selector, getTextOptions],
    });
  }

  static async select(
    { tabId, frameId = 0 }: TabTarget,
    selector: string,
    ...values: string[]
  ) {
    await injectContentHandlerScript(tabId);
    return await RuntimeMessage.instance.sendMessageToTab({
      tabId,
      frameId,
      name: 'element:select',
      args: [selector, ...values],
    });
  }
}

export default TabService;
