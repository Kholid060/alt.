import { UiIcons } from '@altdot/ui';
import { BetterMessagePort } from '@altdot/shared';
import extViewRenderer from './utils/extViewRenderer';
import { ExtensionMessagePortEvent } from '@altdot/extension';
import type { ExtensionCommandViewInitMessage } from '#common/interface/extension.interface';

// @ts-expect-error icons for the extension
window.$UiExtIcons = UiIcons;

async function onMessage({
  ports,
  data,
}: MessageEvent<ExtensionCommandViewInitMessage>) {
  try {
    const [port] = ports;
    if (!port) throw new Error('Message port empty');
    if (typeof data !== 'object' || data.type !== 'init')
      throw new Error('Invalid payload');

    const messagePort =
      BetterMessagePort.createStandalone<ExtensionMessagePortEvent>(
        'sync',
        port,
      );
    await extViewRenderer(
      { launchContext: data.payload.launchContext, messagePort },
      data.themeStyle,
    );
  } catch (error) {
    console.error(error);
  } finally {
    window.removeEventListener('message', onMessage);
  }
}

window.addEventListener('message', onMessage);
