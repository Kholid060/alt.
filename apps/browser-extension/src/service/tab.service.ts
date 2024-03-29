import Browser from 'webextension-polyfill';
import { injectContentHandlerScript } from '../utils/background-content-utils';
import RuntimeMessage from '../utils/RuntimeMessage';
import { KeyboardBrowserTypeOptions } from '@repo/shared';

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
    console.log({ selector });
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
}

export default TabService;
