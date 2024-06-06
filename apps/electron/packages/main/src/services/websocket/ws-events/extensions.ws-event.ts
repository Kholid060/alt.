import BrowserService from '../../browser.service';
import type ExtensionWSNamespace from '../ws-namespaces/extensions.ws-namespace';
import WindowCommand from '/@/window/command-window';

export function initExtensionWSEventsListener(this: ExtensionWSNamespace) {
  this.onSocketEvent('tabs:active', ({ browserInfo }, tab) => {
    BrowserService.instance.setActiveTab({
      tab,
      id: browserInfo.id,
    });

    WindowCommand.instance.sendMessage(
      { name: 'browser:tabs:active', noThrow: true, ensureWindow: false },
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
