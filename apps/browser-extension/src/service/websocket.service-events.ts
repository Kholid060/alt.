import {
  ExtensionWSServerToClientEvents,
  ExtensionWSClientToServerEvents,
} from '@altdot/shared';
import { Socket } from 'socket.io-client';
import TabService from './tab.service';
import Browser from 'webextension-polyfill';
import BackgroundFileHandle from '../pages/background/BackgroundFileHandle';
import BrowserService from './browser.service';

function wsAckHandler<T extends unknown[]>(
  fn: (...args: T) => Promise<void> | void,
) {
  return async (...args: T) => {
    try {
      await fn(...args);
    } catch (error) {
      const callback = args.at(-1);
      console.error(error);
      if (callback && typeof callback === 'function') {
        callback({
          error: true,
          errorMessage: (error as Error).message,
        });
        return;
      }

      throw error;
    }
  };
}

export function websocketEventsListener(
  io: Socket<ExtensionWSServerToClientEvents, ExtensionWSClientToServerEvents>,
) {
  io.on(
    'tabs:reload',
    wsAckHandler(async (tab, callback) => {
      await TabService.reload(tab.tabId);
      callback();
    }),
  );

  io.on(
    'tabs:click',
    wsAckHandler(async (tab, selector, callback) => {
      await TabService.mouse(
        {
          tabId: tab.tabId,
        },
        'click',
        selector,
      );
      callback();
    }),
  );

  io.on(
    'tabs:mouse-down',
    wsAckHandler(async (tab, selector, callback) => {
      await TabService.mouse(
        {
          tabId: tab.tabId,
        },
        'down',
        selector,
      );
      callback();
    }),
  );

  io.on(
    'tabs:mouse-up',
    wsAckHandler(async (tab, selector, callback) => {
      await TabService.mouse(
        {
          tabId: tab.tabId,
        },
        'up',
        selector,
      );
      callback();
    }),
  );

  io.on(
    'tabs:type',
    wsAckHandler(async (tab, selector, text, options, callback) => {
      await TabService.type(
        {
          tabId: tab.tabId,
        },
        { selector, text, options },
      );
      callback();
    }),
  );

  io.on(
    'tabs:get-text',
    wsAckHandler(async (tab, selector, options, callback) => {
      const result = await TabService.getText(
        {
          tabId: tab.tabId,
        },
        selector,
        options,
      );
      callback(result);
    }),
  );

  io.on(
    'tabs:select',
    wsAckHandler(async (tab, selector, values, callback) => {
      const result = await TabService.select(
        {
          tabId: tab.tabId,
        },
        selector,
        ...values,
      );
      callback(result);
    }),
  );

  io.on(
    'tabs:key-down',
    wsAckHandler(async (tab, selector, key, options, callback) => {
      const result = await TabService.keyDown(
        {
          tabId: tab.tabId,
        },
        selector,
        key,
        options,
      );
      callback(result);
    }),
  );

  io.on(
    'tabs:key-up',
    wsAckHandler(async (tab, selector, key, options, callback) => {
      const result = await TabService.keyUp(
        {
          tabId: tab.tabId,
        },
        selector,
        key,
        options,
      );
      callback(result);
    }),
  );

  io.on(
    'tabs:press',
    wsAckHandler(async (tab, selector, key, options, callback) => {
      const result = await TabService.press(
        {
          tabId: tab.tabId,
        },
        selector,
        key,
        options,
      );
      callback(result);
    }),
  );

  io.on(
    'tabs:get-attributes',
    wsAckHandler(async (tab, selector, attrNames, callback) => {
      const result = await TabService.getAttributes(
        {
          tabId: tab.tabId,
        },
        selector,
        attrNames ?? undefined,
      );
      callback(result);
    }),
  );

  io.on(
    'tabs:set-attributes',
    wsAckHandler(async (tab, selector, attrs, callback) => {
      await TabService.setAttributes(
        {
          tabId: tab.tabId,
        },
        selector,
        attrs,
      );
      callback();
    }),
  );

  io.on(
    'tabs:element-exists',
    wsAckHandler(async (tab, selector, multiple, callback) => {
      const result = await TabService.elementExist(
        {
          tabId: tab.tabId,
        },
        selector,
        multiple,
      );
      callback(result);
    }),
  );

  io.on(
    'tabs:select-element',
    wsAckHandler(async (tab, options, callback) => {
      const result = await TabService.selectElement(
        {
          tabId: tab.tabId,
        },
        options,
      );
      callback(result);
    }),
  );

  io.on(
    'tabs:wait-for-selector',
    wsAckHandler(async (tab, selector, options, callback) => {
      await TabService.waitForSelector(
        {
          tabId: tab.tabId,
        },
        selector,
        options,
      );
      callback();
    }),
  );

  io.on(
    'tabs:get-html',
    wsAckHandler(async (tab, selector, options, callback) => {
      const html = await TabService.getHTML(
        {
          tabId: tab.tabId,
        },
        selector,
        options,
      );
      callback(html);
    }),
  );

  io.on(
    'tabs:get-active',
    wsAckHandler(async (callback) => {
      let [tab] = await Browser.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (!tab) [tab] = await Browser.tabs.query({ active: true });

      callback({
        id: tab.id!,
        url: tab.url!,
        title: tab.title!,
        windowId: tab.windowId!,
      });
    }),
  );

  io.on(
    'tabs:create-new',
    wsAckHandler(async (url, callback) => {
      const tab = await Browser.tabs.create({
        url,
      });

      callback({
        id: tab.id!,
        url: tab.url!,
        title: tab.title!,
        windowId: tab.windowId!,
      });
    }),
  );

  io.on(
    'tabs:select-file',
    wsAckHandler(async (tab, selector, files, callback) => {
      const fileId = BackgroundFileHandle.instance.addFiles(files);
      await TabService.selectFile({ tabId: tab.tabId }, selector, fileId);

      callback();
    }),
  );

  io.on(
    'tabs:get-detail',
    wsAckHandler(async (tab, callback) => {
      const tabDetail = await Browser.tabs.get(tab.tabId);
      callback(
        tabDetail
          ? {
              id: tabDetail.id!,
              url: tabDetail.url!,
              title: tabDetail.title!,
              active: tabDetail.active!,
              windowId: tabDetail.windowId!,
            }
          : null,
      );
    }),
  );

  io.on(
    'tabs:query',
    wsAckHandler(
      async (
        {
          active,
          index,
          status,
          title,
          url,
          lastFocusedWindow,
          lastFocusedBrowser,
        },
        callback,
      ) => {
        let windowId: number | undefined;
        if (lastFocusedBrowser) {
          if (!BrowserService.instance.isFocused) return callback([]);
          windowId = BrowserService.instance.focusedWindowId;
        }

        const tabs = await Browser.tabs.query({
          url,
          index,
          title,
          active,
          status,
          windowId,
          lastFocusedWindow,
        });
        callback(
          tabs.map((tab) => ({
            id: tab.id!,
            url: tab.url!,
            title: tab.title!,
            active: tab.active!,
            windowId: tab.windowId!,
          })),
        );
      },
    ),
  );
}
