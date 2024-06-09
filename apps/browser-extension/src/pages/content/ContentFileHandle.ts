import { BetterMessagePort, sleep } from '@repo/shared';
import type { BetterMessagePortAsync } from '@repo/shared';
import { ContentIframeEvents } from '@root/src/interface/content-iframe.interface';
import Browser from 'webextension-polyfill';

async function createIframe() {
  const iframe = document.createElement('iframe');
  iframe.src = Browser.runtime.getURL('/content-iframe.html');

  document.body.style.display = 'none !important';
  document.body.appendChild(iframe);

  if (!iframe.contentWindow) throw new Error("Can't access iframe");

  await sleep(500);

  const messageChannel = new MessageChannel();
  iframe.contentWindow.postMessage('init', '*', [messageChannel.port1]);

  return {
    iframe,
    messagePort: messageChannel.port2,
  };
}

class ContentFileHandle {
  static instance = new ContentFileHandle();

  private iframe: HTMLIFrameElement | null = null;
  private messagePort: BetterMessagePortAsync<ContentIframeEvents> | null =
    null;

  constructor() {}

  private async getPort() {
    if (!this.iframe || !this.iframe.parentNode) {
      this.iframe = null;
      this.messagePort?.destroy();
      this.messagePort = null;

      const { iframe, messagePort } = await createIframe();
      this.iframe = iframe;
      this.messagePort = BetterMessagePort.createStandalone(
        'async',
        messagePort,
      );
    }
    if (!this.iframe || !this.messagePort) {
      throw new Error('Missing required data');
    }

    return this.messagePort;
  }

  async requestFile(fileId: string) {
    const port = await this.getPort();
    const files = await port.sendMessage('file:request', fileId);

    return files;
  }
}

export default ContentFileHandle;
