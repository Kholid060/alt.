import { BetterMessagePortAsync } from '@repo/shared';
import {
  ContentIframeEvents,
  ContentIframeToBackgroundEvents,
} from '@root/src/interface/content-iframe.interface';

let serviceWorker: ServiceWorker | null = null;
let messagePort: BetterMessagePortAsync<ContentIframeEvents> | null = null;

async function getServiceWorker() {
  if (serviceWorker) return;

  serviceWorker = (await navigator.serviceWorker.ready).active;
  if (!serviceWorker) throw new Error('Missing ServiceWorker');
}

function onMessage({ data, ports: [port] }: MessageEvent) {
  if (data !== 'init' || !port || messagePort) return;

  const bgMessagePort =
    new BetterMessagePortAsync<ContentIframeToBackgroundEvents>((payload) => {
      if (!serviceWorker) throw new Error('Missing ServiceWorker');

      serviceWorker.postMessage(payload);
    });
  navigator.serviceWorker.addEventListener('message', (message) => {
    bgMessagePort.messageHandler(message.data);
  });

  messagePort = new BetterMessagePortAsync((payload) => {
    if (Array.isArray(payload) && payload[0].contents) {
      port.postMessage(
        payload,
        payload.map((item) => item.contents),
      );
      return;
    }

    port.postMessage(payload);
  });
  messagePort.on('file:request', async (fileId) => {
    await getServiceWorker();
    return await bgMessagePort.sendMessage('file:request', fileId);
  });

  port.addEventListener('message', (message) => {
    messagePort?.messageHandler(message.data);
  });
  port.start();
}

window.addEventListener('message', onMessage);
