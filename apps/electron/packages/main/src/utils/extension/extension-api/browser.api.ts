import { ExtensionError } from '#packages/common/errors/custom-errors';
import ExtensionIPCEvent from '../ExtensionIPCEvent';
import ExtensionWSNamespace from '/@/services/websocket/ws-namespaces/extensions.ws-namespace';
import {
  extensionBrowserElementHandle,
  isWSAckError,
} from '../ExtensionBrowserElementHandle';
import type ExtensionAPI from '@repo/extension-core/types/extension-api';
import { tempHideCommandWindow } from '../../helper';
import BrowserService from '/@/services/browser.service';

const getElementSelector = (
  selector: ExtensionAPI.browser.ElementSelector,
): ExtensionAPI.browser.ElementSelectorDetail =>
  typeof selector === 'string' ? { selector } : selector;

ExtensionIPCEvent.instance.on(
  'browser.activeTab.isAvailable',
  ({ browserCtx }) => {
    if (!browserCtx) return Promise.resolve(false);

    return Promise.resolve(
      Boolean(BrowserService.instance.getBrowser(browserCtx.browserId)),
    );
  },
);

ExtensionIPCEvent.instance.on(
  'browser.activeTab.reload',
  async ({ browserCtx }) => {
    if (!browserCtx) {
      throw new ExtensionError("Couldn't find active tab browser");
    }

    const { browserId, id, windowId } = browserCtx;
    const result = await ExtensionWSNamespace.instance.emitToBrowserWithAck({
      browserId,
      name: 'tabs:reload',
      args: [
        {
          windowId,
          tabId: id,
        },
      ],
    });
    if (isWSAckError(result)) {
      throw new ExtensionError(result.errorMessage);
    }
  },
);

ExtensionIPCEvent.instance.on(
  'browser.activeTab.click',
  ({ browserCtx }, selector) => {
    return extensionBrowserElementHandle(
      browserCtx,
      'click',
      getElementSelector(selector),
    );
  },
);

ExtensionIPCEvent.instance.on(
  'browser.activeTab.type',
  ({ browserCtx }, selector, text, options) => {
    return extensionBrowserElementHandle(
      browserCtx,
      'type',
      getElementSelector(selector),
      text,
      options ?? {},
    );
  },
);

ExtensionIPCEvent.instance.on(
  'browser.activeTab.getText',
  ({ browserCtx }, selector, options) => {
    return extensionBrowserElementHandle(
      browserCtx,
      'getText',
      getElementSelector(selector ?? 'html'),
      options,
    );
  },
);

ExtensionIPCEvent.instance.on(
  'browser.activeTab.getHTML',
  ({ browserCtx }, selector, options) => {
    return extensionBrowserElementHandle(
      browserCtx,
      'getHTML',
      getElementSelector(selector ?? 'html'),
      options ?? {},
    );
  },
);

ExtensionIPCEvent.instance.on(
  'browser.activeTab.select',
  ({ browserCtx }, selector, ...values) => {
    return extensionBrowserElementHandle(
      browserCtx,
      'select',
      getElementSelector(selector),
      values,
    );
  },
);

ExtensionIPCEvent.instance.on(
  'browser.activeTab.keyDown',
  ({ browserCtx }, selector, ...args) => {
    return extensionBrowserElementHandle(
      browserCtx,
      'keyDown',
      getElementSelector(selector),
      ...args,
    );
  },
);

ExtensionIPCEvent.instance.on(
  'browser.activeTab.keyUp',
  ({ browserCtx }, selector, ...args) => {
    return extensionBrowserElementHandle(
      browserCtx,
      'keyUp',
      getElementSelector(selector),
      ...args,
    );
  },
);

ExtensionIPCEvent.instance.on(
  'browser.activeTab.press',
  ({ browserCtx }, selector, ...args) => {
    return extensionBrowserElementHandle(
      browserCtx,
      'press',
      getElementSelector(selector),
      ...args,
    );
  },
);

ExtensionIPCEvent.instance.on(
  'browser.activeTab.getAttributes',
  ({ browserCtx }, selector, attrNames) => {
    return extensionBrowserElementHandle(
      browserCtx,
      'getAttributes',
      getElementSelector(selector),
      attrNames ?? null,
    );
  },
);

ExtensionIPCEvent.instance.on(
  'browser.activeTab.elementExists',
  async ({ browserCtx }, selector, multiple) => {
    if (!browserCtx) {
      throw new ExtensionError("Couldn't find active tab browser");
    }

    const { browserId, id, windowId } = browserCtx;
    const result = await ExtensionWSNamespace.instance.emitToBrowserWithAck({
      browserId,
      name: 'tabs:element-exists',
      args: [
        {
          windowId,
          tabId: id,
        },
        { selector },
        multiple ?? false,
      ],
    });
    if (isWSAckError(result)) {
      throw new ExtensionError(result.errorMessage);
    }

    return result;
  },
);

ExtensionIPCEvent.instance.on(
  'browser.activeTab.selectElement',
  async ({ browserCtx }, options) => {
    if (!browserCtx) {
      throw new ExtensionError("Couldn't find active tab browser");
    }

    const { browserId, id, windowId } = browserCtx;
    const selectedElement = await tempHideCommandWindow(async () => {
      const result = await ExtensionWSNamespace.instance.emitToBrowserWithAck({
        browserId,
        timeout: 300_000, // 5 minutes
        name: 'tabs:select-element',
        args: [
          {
            windowId,
            tabId: id,
          },
          options ?? {},
        ],
      });
      if (isWSAckError(result)) {
        throw new ExtensionError(result.errorMessage);
      }

      return result;
    });

    return selectedElement;
  },
);

ExtensionIPCEvent.instance.on(
  'browser.activeTab.waitForSelector',
  // @ts-expect-error only for waiting the element
  async ({ browserCtx }, selector, options) => {
    const timeout = Math.max(+(options?.timeout || 90_000), 10_000);
    if (!browserCtx) {
      throw new ExtensionError("Couldn't find active tab browser");
    }

    const { browserId, id, windowId } = browserCtx;
    const result = await ExtensionWSNamespace.instance.emitToBrowserWithAck({
      timeout,
      browserId,
      name: 'tabs:wait-for-selector',
      args: [
        {
          windowId,
          tabId: id,
        },
        { selector },
        { timeout, ...(options ?? {}) },
      ],
    });
    if (isWSAckError(result)) {
      throw new ExtensionError(result.errorMessage);
    }
  },
);
