import {
  ExtensionWSServerToClientEvents,
  ExtensionWSClientToServerEvents,
} from '@repo/shared';
import { Socket } from 'socket.io-client';
import TabService from './tab.service';

function wsAckHandler<T extends unknown[]>(
  fn: (...args: T) => Promise<void> | void,
) {
  return async (...args: T) => {
    try {
      await fn(...args);
    } catch (error) {
      const callback = args.at(-1);
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
      await TabService.click(
        {
          tabId: tab.tabId,
        },
        selector,
      );
      callback();
    }),
  );

  io.on(
    'tabs:type',
    wsAckHandler(async (tab, { selector, text, options }, callback) => {
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
    wsAckHandler(async (tab, { selector, options }, callback) => {
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
}
