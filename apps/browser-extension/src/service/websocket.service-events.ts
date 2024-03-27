import {
  ExtensionWSServerToClientEvents,
  ExtensionWSClientToServerEvents,
} from '@repo/shared';
import { Socket } from 'socket.io-client';
import Browser from 'webextension-polyfill';

export function websocketEventsListener(
  io: Socket<ExtensionWSServerToClientEvents, ExtensionWSClientToServerEvents>,
) {
  io.on('tabs:reload', async (tab, callback) => {
    try {
      await Browser.tabs.reload(tab.tabId);
      callback();
    } catch (error) {
      callback({
        error: true,
        errorMessage: (error as Error).message,
      });
    }
  });
}
