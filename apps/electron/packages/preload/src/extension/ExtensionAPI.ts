/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ExtensionMessagePortEvent } from '@altdot/extension';
import {
  CUSTOM_SCHEME,
  PRELOAD_API_KEY,
} from '#common/utils/constant/constant';
import type { IPCUserExtensionEventsMap } from '#common/interface/ipc-events.interface';
import { contextBridge } from 'electron';
import { BetterMessagePort } from '@altdot/shared';
import { createExtensionAPI } from '#common/utils/extension/extension-api-factory';
import IPCRenderer from '#common/utils/IPCRenderer';
import { EXTENSION_MESSAGE_PORT_EVENT_TIMEOUT_MS } from '#common/utils/constant/extension.const';
import type {
  ExtensionCommandExecutePayload,
  ExtensionCommandViewInitMessage,
} from '#common/interface/extension.interface';
import { isIPCEventError } from '#common/utils/helper';

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
  messagePort: BetterMessagePort<ExtensionMessagePortEvent>;

  constructor({
    payload,
    messagePort,
  }: {
    messagePort: MessagePort;
    payload: ExtensionCommandExecutePayload;
  }) {
    this.payload = payload;
    this.messagePort = new BetterMessagePort(messagePort, {
      eventTimeoutMs: EXTENSION_MESSAGE_PORT_EVENT_TIMEOUT_MS,
    });
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
      sendMessage: this.sendAction.bind(this),
    });

    return Object.freeze(extensionAPI);
  }

  private sendAction<T extends keyof IPCUserExtensionEventsMap>(
    name: T,
    ...args: Parameters<IPCUserExtensionEventsMap[T]>
  ): ReturnType<IPCUserExtensionEventsMap[T]> {
    return IPCRenderer.invoke('user-extension', {
      name,
      args,
      key: this.key,
      commandId: this.payload.commandId,
      browserCtx: this.payload.browserCtx ?? null,
    }).then((result) => {
      if (isIPCEventError(result)) {
        throw new Error(result.message);
      }

      return result;
    }) as ReturnType<IPCUserExtensionEventsMap[T]>;
  }
}

export default ExtensionAPI;
