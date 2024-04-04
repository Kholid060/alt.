import Browser from 'webextension-polyfill';
import { injectContentHandlerScript } from '../utils/background-content-utils';
import RuntimeMessage from '../utils/RuntimeMessage';
import {
  BrowserGetTextOptions,
  ExtensionBrowserElementSelector,
  KeyboardBrowserTypeOptions,
} from '@repo/shared';
import type ExtensionAPI from '@repo/extension-core/types/extension-api';

interface TabTarget {
  tabId: number;
  frameId?: number;
}

class TabService {
  static reload(tabId: number) {
    return Browser.tabs.reload(tabId);
  }

  static async click(
    { tabId, frameId = 0 }: TabTarget,
    selector: ExtensionBrowserElementSelector,
  ) {
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
      selector: ExtensionBrowserElementSelector;
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
    selector?: ExtensionBrowserElementSelector,
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
    selector: ExtensionBrowserElementSelector,
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

  static async keyDown(
    { tabId, frameId = 0 }: TabTarget,
    selector: ExtensionBrowserElementSelector,
    key: string,
    options?: ExtensionAPI.browser.KeyDownOptions,
  ) {
    await injectContentHandlerScript(tabId);
    return await RuntimeMessage.instance.sendMessageToTab({
      tabId,
      frameId,
      name: 'element:key-down',
      args: [selector, key, options],
    });
  }

  static async keyUp(
    { tabId, frameId = 0 }: TabTarget,
    selector: ExtensionBrowserElementSelector,
    key: string,
    options?: ExtensionAPI.browser.KeyUpOptions,
  ) {
    await injectContentHandlerScript(tabId);
    return await RuntimeMessage.instance.sendMessageToTab({
      tabId,
      frameId,
      name: 'element:key-up',
      args: [selector, key, options],
    });
  }

  static async press(
    { tabId, frameId = 0 }: TabTarget,
    selector: ExtensionBrowserElementSelector,
    key: string,
    options?: ExtensionAPI.browser.KeyUpOptions &
      ExtensionAPI.browser.KeyDownOptions,
  ) {
    await injectContentHandlerScript(tabId);
    return await RuntimeMessage.instance.sendMessageToTab({
      tabId,
      frameId,
      name: 'element:press',
      args: [selector, key, options],
    });
  }

  static async getAttributes(
    { tabId, frameId = 0 }: TabTarget,
    selector: ExtensionBrowserElementSelector,
    attrNames?: string | string[],
  ) {
    await injectContentHandlerScript(tabId);
    return await RuntimeMessage.instance.sendMessageToTab({
      tabId,
      frameId,
      name: 'element:get-attributes',
      args: [selector, attrNames],
    });
  }

  static async elementExist(
    { tabId, frameId = 0 }: TabTarget,
    { selector }: ExtensionBrowserElementSelector,
    multiple: boolean = false,
  ) {
    await injectContentHandlerScript(tabId);
    return await RuntimeMessage.instance.sendMessageToTab({
      tabId,
      frameId,
      name: 'element:element-exists',
      args: [selector, multiple],
    });
  }
}

export default TabService;
