/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ExtensionMessagePortEvent } from '@alt-dot/extension';
import {
  CUSTOM_SCHEME,
  PRELOAD_API_KEY,
} from '#common/utils/constant/constant';
import type { IPCUserExtensionEventsMap } from '#common/interface/ipc-events.interface';
import { contextBridge } from 'electron';
import type { BetterMessagePortSync, EventMapEmit } from '@alt-dot/shared';
import { BetterMessagePort } from '@alt-dot/shared';
import { createExtensionAPI } from '#common/utils/extension/extension-api-factory';
import IPCRenderer from '#common/utils/IPCRenderer';
import type {
  ExtensionCommandExecutePayload,
  ExtensionCommandViewInitMessage,
} from '#common/interface/extension.interface';

function setExtView(type: 'empty' | 'error' = 'empty') {
  contextBridge.exposeInMainWorld(PRELOAD_API_KEY.extension, {
    $extView: type,
  });
}

class ExtensionAPI {
  static init() {
    window.addEventListener(
      'message',
      ({ ports, data }: MessageEvent<ExtensionCommandViewInitMessage>) => {
        const [messagePort] = ports;
        if (!messagePort) throw new Error('PORT IS EMPTY');

        new ExtensionAPI({
          messagePort,
          payload: data.payload,
        }).loadAPI();
      },
      { once: true },
    );
  }

  private key: string = '';

  payload: ExtensionCommandExecutePayload;
  messagePort: BetterMessagePortSync<ExtensionMessagePortEvent>;

  constructor({
    payload,
    messagePort,
  }: {
    messagePort: MessagePort;
    payload: ExtensionCommandExecutePayload;
  }) {
    this.payload = payload;
    this.messagePort = BetterMessagePort.createStandalone('sync', messagePort);
  }

  async loadAPI() {
    try {
      if (!window.location.href.startsWith(CUSTOM_SCHEME.extension))
        return setExtView();

      const { extensionId, commandId } = this.payload;
      const command = await IPCRenderer.invokeWithError(
        'database:get-command',
        { commandId, extensionId },
      );
      if (!command) throw new Error('Extension command not found');
      if (command.type !== 'view')
        throw new Error('Command is not a "view" type');

      this.key = extensionId;

      const extensionApi = await this.getExtensionAPI();
      contextBridge.exposeInMainWorld(PRELOAD_API_KEY.extension, {
        ...extensionApi,
        $commandId: commandId,
      });
    } catch (error) {
      console.error(error);
      setExtView('error');
    }
  }

  async getExtensionAPI(): Promise<typeof _extension> {
    const extensionAPI = createExtensionAPI({
      context: this,
      messagePort: this.messagePort,
      browserCtx: this.payload.browserCtx ?? null,
      sendMessage: this.sendAction.bind(
        this,
      ) as EventMapEmit<IPCUserExtensionEventsMap>,
    });

    return Object.freeze(extensionAPI);
  }

  private async sendAction<T extends keyof IPCUserExtensionEventsMap>(
    name: T,
    ...args: Parameters<IPCUserExtensionEventsMap[T]>
  ) {
    const result = (await IPCRenderer.invoke('user-extension', {
      name,
      args,
      key: this.key,
      commandId: this.payload.commandId,
      browserCtx: this.payload.browserCtx ?? null,
    })) as any;
    if (typeof result === 'object' && result && '$isError' in result) {
      throw new Error(result.message);
    }

    return result;
  }
}

export default ExtensionAPI;
