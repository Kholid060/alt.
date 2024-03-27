import WindowsManager from '/@/window/WindowsManager';
import { sendIpcMessageToWindow } from '/@/utils/ipc-main';
import type ServerService from './server.service';
import BrowserService from './browser.service';

export function initServerServiceEventListener(this: ServerService) {
  if (!this._messagePort) return;

  const commandWindow = WindowsManager.instance.getWindow('command');
  const sendIpcMessage = sendIpcMessageToWindow(commandWindow);

  this._messagePort.onMessage('tabs:active', ({ browserId }, activeTab) => {
    BrowserService.instance.activeBrowser = {
      id: browserId,
      tab: activeTab,
    };
    sendIpcMessage('browser:tabs:active', activeTab);
  });
  this._messagePort.onMessage('socket:connect', (browserInfo) => {
    BrowserService.instance.browsers.set(browserInfo.id, browserInfo);
  });
  this._messagePort.onMessage('socket:disconnect', (browserInfo) => {
    BrowserService.instance.browsers.delete(browserInfo.id);
  });
}
