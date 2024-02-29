import type { ExtensionCommand } from '@repo/extension-core';
import extViewRenderer from './utils/extViewRenderer';
import extActionRenderer from './utils/extActionRenderer';
import { AMessagePort } from '@repo/shared';
import type { ExtensionMessagePortEvent } from '@repo/extension/dist/interfaces/message-events';

async function onMessage({ ports, data }: MessageEvent) {
  try {
    const [port] = ports;
    if (!port) throw new Error('Message port empty');
    if (typeof data !== 'object' || data.type !== 'init' || !data.commandType)
      throw new Error('Invalid payload');

    const messagePort = new AMessagePort<ExtensionMessagePortEvent>(port);

    switch (data.commandType as ExtensionCommand['type']) {
      case 'view':
        await extViewRenderer(messagePort, data.themeStyle);
        break;
      case 'action':
        await extActionRenderer(messagePort);
        break;
    }
  } catch (error) {
    console.error(error);
  } finally {
    window.removeEventListener('message', onMessage);
  }
}

window.addEventListener('message', onMessage);
