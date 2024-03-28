import Browser from 'webextension-polyfill';
import { injectContentHandlerScript } from '../utils/background-content-utils';
import RuntimeMessage from '../utils/RuntimeMessage';

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
}

export default TabService;
