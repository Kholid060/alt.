import {
  ExtensionWSServerToClientEvents,
  ExtensionWSClientToServerEvents,
} from '@repo/shared';
import { Socket } from 'socket.io-client';
import TabService from './tab.service';

export function websocketEventsListener(
  io: Socket<ExtensionWSServerToClientEvents, ExtensionWSClientToServerEvents>,
) {
  io.on('tabs:reload', async (tab, callback) => {
    try {
      await TabService.reload(tab.tabId);
      callback();
    } catch (error) {
      callback({
        error: true,
        errorMessage: (error as Error).message,
      });
    }
  });
  io.on('tabs:click', async (tab, selector, callback) => {
    try {
      await TabService.click(tab.tabId, selector);
      callback();
    } catch (error) {
      callback({
        error: true,
        errorMessage: (error as Error).message,
      });
    }
  });
  io.on('tabs:type', async (tab, { selector, text, options }, callback) => {
    try {
      await TabService.type(tab.tabId, { selector, text, options });
      callback();
    } catch (error) {
      callback({
        error: true,
        errorMessage: (error as Error).message,
      });
    }
  });
  io.on('tabs:get-text', async (tab, { selector, options }, callback) => {
    try {
      const result = await TabService.getText(tab.tabId, selector, options);
      callback(result);
    } catch (error) {
      callback({
        error: true,
        errorMessage: (error as Error).message,
      });
    }
  });
}
