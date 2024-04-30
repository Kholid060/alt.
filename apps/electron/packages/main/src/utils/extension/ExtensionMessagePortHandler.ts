import { isObject } from '@repo/shared';
import { debugLog } from '#common/utils/helper';
import type { ExtensionMessageHandler } from './ExtensionIPCEvent';
import type { IPCUserExtensionEventsMap } from '#common/interface/ipc-events.interface';

class ExtensionMessagePortHandler {
  private ports: Map<string, Electron.MessagePortMain> = new Map();

  constructor(private portMessageHandler: ExtensionMessageHandler) {}

  addPort(port: Electron.MessagePortMain, extPortId: string) {
    debugLog('Add extension MessagePort', extPortId);

    this.ports.set(extPortId, port);
    port.addListener('close', this.deletePort.bind(this, extPortId));
    port.addListener('message', this.onMessagePortMessage.bind(this, port));

    port.start();
  }

  deletePort(extPortId: string) {
    const port = this.ports.get(extPortId);
    if (!port) return;

    debugLog('Delete extension MessagePort', extPortId);

    port.removeAllListeners();
    port.close();

    this.ports.delete(extPortId);
  }

  private async onMessagePortMessage(
    currentPort: Electron.MessagePortMain,
    { data }: Electron.MessageEvent,
  ) {
    if (
      !isObject(data) ||
      typeof data.key !== 'string' ||
      typeof data.name !== 'string' ||
      typeof data.messageId !== 'string' ||
      !Array.isArray(data.args)
    ) {
      throw new Error('Invalid message payload');
    }

    const result = await this.portMessageHandler({
      sender: null,
      key: data.key,
      commandId: data.commandId as string,
      name: data.name as keyof IPCUserExtensionEventsMap,
      args: data.args as Parameters<
        IPCUserExtensionEventsMap[keyof IPCUserExtensionEventsMap]
      >,
    });

    currentPort.postMessage({
      result,
      messageId: data.messageId,
    });
  }

  destroy() {
    this.ports.forEach((port) => port.close());
    this.ports.clear();
  }
}

export default ExtensionMessagePortHandler;
