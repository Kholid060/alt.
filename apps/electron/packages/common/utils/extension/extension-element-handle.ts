import type ExtensionAPI from '@repo/extension-core/types/extension-api';
import type { EventMapEmit } from '@repo/shared';
import type { IPCUserExtensionEventsMap } from '../../interface/ipc-events.interface';

export function extensionElementHandleFactory(
  sendMessage: CreateExtensionElementHandleDetail['sendMessage'],
  selector: string,
  elementIndex?: number,
): ExtensionAPI.browser.ElementHandle {
  return {
    click() {
      return sendMessage('browser.activeTab.click', {
        selector,
        elementIndex,
      });
    },
    selectFile(...args) {
      return sendMessage(
        'browser.activeTab.selectFile',
        {
          selector,
          elementIndex,
        },
        ...args,
      );
    },
    keyDown(...args) {
      return sendMessage(
        'browser.activeTab.keyDown',
        {
          selector,
          elementIndex,
        },
        ...args,
      );
    },
    keyUp(...args) {
      return sendMessage(
        'browser.activeTab.keyUp',
        { selector, elementIndex },
        ...args,
      );
    },
    press(...args) {
      return sendMessage(
        'browser.activeTab.press',
        { selector, elementIndex },
        ...args,
      );
    },
    select(...args) {
      return sendMessage(
        'browser.activeTab.select',
        { selector, elementIndex },
        ...args,
      );
    },
    type(...args) {
      return sendMessage(
        'browser.activeTab.type',
        { selector, elementIndex },
        ...args,
      );
    },
    getAttributes(...args) {
      return sendMessage(
        'browser.activeTab.getAttributes',
        { selector, elementIndex },
        ...args,
      );
    },
    getText(...args) {
      return sendMessage(
        'browser.activeTab.getText',
        { selector, elementIndex },
        ...args,
      );
    },
    getHTML(...args) {
      return sendMessage(
        'browser.activeTab.getHTML',
        { selector, elementIndex },
        ...args,
      );
    },
    mouseUp(...args) {
      return sendMessage(
        'browser.activeTab.mouseUp',
        { selector, elementIndex },
        ...args,
      );
    },
    mouseDown(...args) {
      return sendMessage(
        'browser.activeTab.mouseDown',
        { selector, elementIndex },
        ...args,
      );
    },
  };
}

interface CreateExtensionElementHandleDetail {
  selector: string;
  sendMessage: EventMapEmit<IPCUserExtensionEventsMap>;
}

export async function createExtensionElementHandle(
  detail: CreateExtensionElementHandleDetail,
  multiple?: false,
): Promise<ExtensionAPI.browser.ElementHandle | null>;
export async function createExtensionElementHandle(
  detail: CreateExtensionElementHandleDetail,
  multiple: true,
): Promise<ExtensionAPI.browser.ElementHandle[]>;
export async function createExtensionElementHandle(
  { selector, sendMessage }: CreateExtensionElementHandleDetail,
  multiple?: boolean,
): Promise<
  | null
  | ExtensionAPI.browser.ElementHandle
  | ExtensionAPI.browser.ElementHandle[]
> {
  const elementExists = await sendMessage(
    'browser.activeTab.elementExists',
    selector,
    multiple,
  );

  if (Array.isArray(elementExists)) {
    return elementExists.map((index) =>
      extensionElementHandleFactory(sendMessage, selector, index),
    );
  }

  if (!elementExists) return null;

  return extensionElementHandleFactory(sendMessage, selector);
}
