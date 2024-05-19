import BrowserService from '../../browser.service';
import type ExtensionWSNamespace from '../ws-namespaces/extensions.ws-namespace';
import WindowsManager from '/@/window/WindowsManager';

export function initExtensionWSEventsListener(this: ExtensionWSNamespace) {
  this.onSocketEvent('tabs:active', ({ browserInfo }, tab) => {
    BrowserService.instance.setActiveTab({
      tab,
      id: browserInfo.id,
    });

    WindowsManager.instance.sendMessageToWindow(
      'command',
      'browser:tabs:active',
      tab,
    );
  });

  this.on('socket:connected', (browser) => {
    BrowserService.instance.addConnectedBrowser(browser);
  });
  this.on('socket:disconnect', (browser) => {
    BrowserService.instance.removeConnectedBrowser(browser.id);
  });
}
