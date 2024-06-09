import Browser from 'webextension-polyfill';
import { injectContentHandlerScript } from '../utils/background-content-utils';
import RuntimeMessage from '../utils/RuntimeMessage';
import {
  BrowserGetHTMLOptions,
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

  static async mouse(
    { tabId, frameId = 0 }: TabTarget,
    action: 'down' | 'up' | 'click',
    selector: ExtensionBrowserElementSelector,
  ) {
    const mouseEventMap = {
      up: 'element:mouse-up',
      click: 'element:click',
      down: 'element:mouse-down',
    } as const;

    await injectContentHandlerScript(tabId);
    await RuntimeMessage.instance.sendMessageToTab({
      tabId,
      frameId,
      args: [selector],
      name: mouseEventMap[action],
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

  static async getHTML(
    { tabId, frameId = 0 }: TabTarget,
    selector?: ExtensionBrowserElementSelector,
    options?: Partial<BrowserGetHTMLOptions>,
  ) {
    const getHTMLOptions: BrowserGetHTMLOptions = {
      outerHTML: false,
      ...(options ?? {}),
    };
    await injectContentHandlerScript(tabId);

    return await RuntimeMessage.instance.sendMessageToTab({
      tabId,
      frameId,
      name: 'element:get-html',
      args: [selector, getHTMLOptions],
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

  static async setAttributes(
    { tabId, frameId = 0 }: TabTarget,
    selector: ExtensionBrowserElementSelector,
    attrs: Record<string, string>,
  ) {
    await injectContentHandlerScript(tabId);
    return await RuntimeMessage.instance.sendMessageToTab({
      tabId,
      frameId,
      name: 'element:set-attributes',
      args: [selector, attrs],
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

  static async selectElement(
    { tabId, frameId = 0 }: TabTarget,
    options?: ExtensionAPI.browser.activeTab.SelectElementOptions,
  ) {
    await injectContentHandlerScript(tabId);

    // const currentWindow = await Browser.windows.getCurrent();
    // await Browser.windows.update(currentWindow.id!, { focused: true });

    return await RuntimeMessage.instance.sendMessageToTab({
      tabId,
      frameId,
      args: [options],
      name: 'element:select-element',
    });
  }

  static async waitForSelector(
    { tabId, frameId = 0 }: TabTarget,
    selector: ExtensionBrowserElementSelector,
    options?: ExtensionAPI.browser.WaitForSelectorOptions,
  ) {
    await injectContentHandlerScript(tabId);
    return await RuntimeMessage.instance.sendMessageToTab({
      tabId,
      frameId,
      args: [selector, options],
      name: 'element:wait-selector',
    });
  }

  static async selectFile(
    { tabId, frameId = 0 }: TabTarget,
    selector: ExtensionBrowserElementSelector,
    fileId: string,
  ) {
    await injectContentHandlerScript(tabId);
    return await RuntimeMessage.instance.sendMessageToTab({
      tabId,
      frameId,
      args: [selector, fileId],
      name: 'element:select-file',
    });
  }
}

export default TabService;
