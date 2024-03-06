import extViewRenderer from './utils/extViewRenderer';
import { AMessagePort } from '@repo/shared';
import type { ExtensionMessagePortEvent } from '@repo/extension/dist/interfaces/message-events';

async function onMessage({ ports, data }: MessageEvent) {
  try {
    const [port] = ports;
    if (!port) throw new Error('Message port empty');
    if (typeof data !== 'object' || data.type !== 'init')
      throw new Error('Invalid payload');

    const messagePort = new AMessagePort<ExtensionMessagePortEvent>(port);

    await extViewRenderer(
      { commandArgs: data.commandArgs, messagePort },
      data.themeStyle,
    );
  } catch (error) {
    console.error(error);
  } finally {
    window.removeEventListener('message', onMessage);
  }
}

window.addEventListener('message', onMessage);
