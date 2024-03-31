import Browser from 'webextension-polyfill';
import { injectContentHandlerScript } from '../utils/background-content-utils';
import RuntimeMessage from '../utils/RuntimeMessage';
import {
  BrowserGetTextOptions,
  KeyboardBrowserTypeOptions,
} from '@repo/shared';

class TabService {
  static reload(tabId: number) {
    return Browser.tabs.reload(tabId);
  }

  static async click(tabId: number, selector: string) {
    await injectContentHandlerScript(tabId);
    await RuntimeMessage.instance.sendMessageToTab({
      tabId,
      frameId: 0,
      args: [selector],
      name: 'element:click',
    });
  }

  static async type(
    tabId: number,
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
      name: 'element:keyboard-type',
      args: [selector, text, options],
    });
  }

  static async getText(
    tabId: number,
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
      frameId: 0,
      name: 'element:get-text',
      args: [selector, getTextOptions],
    });
  }
}

export default TabService;
