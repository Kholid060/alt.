import { MessageChannelMain } from 'electron';
import type { ExtensionMessageHandler } from '../ipc-extension-messages';
import { isObject } from '@repo/shared';

class ExtensionMessagePortHandler {
  private messageChannel: MessageChannelMain | null = null;

  portMessageHandler: ExtensionMessageHandler;

  constructor({
    portMessageHandler,
  }: {
    portMessageHandler: ExtensionMessageHandler;
  }) {
    this.portMessageHandler = portMessageHandler;
    this.onPortMessage = this.onPortMessage.bind(this);
  }

  onRequestPort() {
    this.messageChannel = new MessageChannelMain();

    this.messageChannel.port2.start();
    this.messageChannel.port2.on('message', this.onPortMessage);

    return this.messageChannel.port1;
  }

  private async onPortMessage({ data }: Electron.MessageEvent) {
    if (
      !isObject(data) ||
      typeof data.key !== 'string' ||
      typeof data.name !== 'string' ||
      typeof data.messageId !== 'string' ||
      !Array.isArray(data.args)
    ) {
      throw new Error('Invalid message payload');
    }
    if (!this.messageChannel) {
      throw new Error("Message channel hasn't been initialized");
    }

    const result = await this.portMessageHandler({
      sender: null,
      key: data.key,
      args: data.args,
      name: data.name,
    });

    this.messageChannel.port2.postMessage({
      result,
      messageId: data.messageId,
    });
  }

  destroy() {
    if (this.messageChannel) {
      this.messageChannel.port2.removeAllListeners();

      this.messageChannel.port1.close();
      this.messageChannel.port2.close();

      this.messageChannel = null;
    }
  }
}

export default ExtensionMessagePortHandler;
