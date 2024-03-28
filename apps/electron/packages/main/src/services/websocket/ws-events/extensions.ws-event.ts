import BrowserService from '../../browser.service';
import type ExtensionWSNamespace from '../ws-namespaces/extensions.ws-namespace';
import WindowsManager from '/@/window/WindowsManager';

export function initExtensionWSEventsListener(this: ExtensionWSNamespace) {
  this.onSocketEvent('tabs:active', ({ browserInfo }, tab) => {
    BrowserService.instance.activeBrowser = {
      tab,
      id: browserInfo.id,
    };

    WindowsManager.instance.sendMessageToWindow(
      'command',
      'browser:tabs:active',
      tab,
    );
  });

  this.on('socket:connected', (browser) => {
    BrowserService.instance.browsers.set(browser.id, browser);
  });
  this.on('socket:disconnect', (browser) => {
    BrowserService.instance.browsers.delete(browser.id);
  });
}
