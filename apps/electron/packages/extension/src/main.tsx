import { BetterMessagePort } from '@altdot/shared';
import {
  CreateExtensionAPI,
  createExtensionAPI,
} from '#common/utils/extension/extension-api-factory';
import extViewRenderer from './utils/extViewRenderer';
import {
  ExtensionMessagePortEvent,
  ExtensionMessagePortEventAsync,
} from '@altdot/extension';
import type {
  ExtensionCommandExecutePayloadWithData,
  ExtensionCommandViewInitMessage,
} from '#common/interface/extension.interface';
import { PRELOAD_API_KEY } from '#common/utils/constant/constant';
import { ExtensionErrorUnhandledVanilla } from './components/extension-errors';
import { applyTheme } from '#common/utils/helper';
import injectComponents from './utils/injectComponents';
import '@altdot/ui/dist/theme.css';
import { MODULE_MAP } from './utils/constant';
import { forwardConsoleHandler } from '#common/utils/forwardConsoleHandler';
import { FORWARD_CONSOLE_TYPE } from '../../main/src/common/utils/forward-console';

declare global {
  interface Window {
    $$extIPC: CreateExtensionAPI['sendMessage'];
  }
}

type ExtensionMessagePort = BetterMessagePort<
  ExtensionMessagePortEventAsync,
  ExtensionMessagePortEvent
>;

async function injectExtensionAPI({
  messagePort,
  viewActionPort,
  payload: { browserCtx, platform, command },
}: {
  viewActionPort?: MessagePort;
  messagePort: ExtensionMessagePort;
  payload: ExtensionCommandExecutePayloadWithData;
}) {
  await new Promise<void>((resolve) => {
    function isLoaded() {
      if ('$$extIPC' in window) return resolve();

      setTimeout(isLoaded, 100);
    }
    isLoaded();
  });

  if (viewActionPort) {
    viewActionPort.addEventListener('message', ({ data }) => {
      if (data.type !== FORWARD_CONSOLE_TYPE) return;
      forwardConsoleHandler({
        ...data,
        commandTitle: command.title,
        extensionTitle: command.extension.title,
      });
    });
  }

  const extensionAPI = createExtensionAPI({
    platform,
    messagePort,
    viewActionPort,
    sendMessage: window.$$extIPC,
    browserCtx: browserCtx ?? null,
  });
  Object.defineProperty(window, PRELOAD_API_KEY.extension, {
    writable: false,
    configurable: false,
    value: extensionAPI,
  });
}
async function loadStyle() {
  if (import.meta.env.DEV) {
    const cssPath = `.${MODULE_MAP.css}`;
    const { default: styleStr } = (await import(cssPath)) as {
      default: string;
    };
    const styleEl = document.createElement('style');
    styleEl.textContent = styleStr;

    document.head.appendChild(styleEl);
    return;
  }

  const linkEl = document.createElement('link');
  linkEl.rel = 'stylesheet';
  linkEl.href = MODULE_MAP.css;

  document.head.appendChild(linkEl);
}

async function onMessage({
  data,
  ports,
}: MessageEvent<ExtensionCommandViewInitMessage>) {
  try {
    const [port, viewActionPort] = ports;
    if (!port) throw new Error('Message port empty');
    if (typeof data !== 'object' || data.type !== 'init')
      throw new Error('Invalid payload');

    applyTheme(data.theme);

    const messagePort: ExtensionMessagePort = new BetterMessagePort(port);
    await injectExtensionAPI({
      messagePort,
      viewActionPort,
      payload: data.payload,
    });
    injectComponents();

    await loadStyle();
    await extViewRenderer({
      messagePort: messagePort.sync,
      launchContext: data.payload.launchContext,
    });

    messagePort.sync.on('app:theme-changed', applyTheme);
  } catch (error) {
    console.error(error);
    ExtensionErrorUnhandledVanilla(error as Error);
  } finally {
    window.removeEventListener('message', onMessage);
  }
}

window.addEventListener('message', onMessage);
