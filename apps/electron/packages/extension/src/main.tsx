import { UiIcons } from '@altdot/ui';
import { BetterMessagePort } from '@altdot/shared';
import { CreateExtensionAPI, createExtensionAPI } from '#common/utils/extension/extension-api-factory';
import extViewRenderer from './utils/extViewRenderer';
import { ExtensionMessagePortEvent, ExtensionMessagePortEventAsync } from '@altdot/extension';
import type { ExtensionBrowserTabContext, ExtensionCommandViewInitMessage } from '#common/interface/extension.interface';
import { PRELOAD_API_KEY } from '#common/utils/constant/constant';

declare global {
  interface Window {
    $$extIPC: CreateExtensionAPI['sendMessage'];
  }
}

// @ts-expect-error icons for the extension
window.$UiExtIcons = UiIcons;

type ExtensionMessagePort = BetterMessagePort<ExtensionMessagePortEventAsync, ExtensionMessagePortEvent>;

async function injectExtensionAPI(messagePort: ExtensionMessagePort, browserCtx?: ExtensionBrowserTabContext) {
  await new Promise<void>((resolve) => {
    function isLoaded() {
      if ('$$extIPC' in window) return resolve();

      setTimeout(isLoaded, 100);
    }
    isLoaded();
  });

  const extensionAPI = createExtensionAPI({
    messagePort,
    sendMessage: window.$$extIPC,
    browserCtx: browserCtx ?? null,
  });
  Object.defineProperty(window, PRELOAD_API_KEY.extension, {
    writable: false,
    configurable: false,
    value: extensionAPI,
  });
}

async function onMessage({
  ports,
  data,
}: MessageEvent<ExtensionCommandViewInitMessage>) {
  try {
    const [port] = ports;
    if (!port) throw new Error('Message port empty');
    if (typeof data !== 'object' || data.type !== 'init')
      throw new Error('Invalid payload');

    const messagePort: ExtensionMessagePort = new BetterMessagePort(port);
    await injectExtensionAPI(messagePort, data.payload.browserCtx);
    await extViewRenderer(
      { launchContext: data.payload.launchContext, messagePort: messagePort.sync },
      data.themeStyle,
    );
  } catch (error) {
    console.error(error);
  } finally {
    window.removeEventListener('message', onMessage);
  }
}

window.addEventListener('message', onMessage);
