/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ExtensionMessagePortEvent } from '@repo/extension';
import {
  CUSTOM_SCHEME,
  PRELOAD_API_KEY,
} from '#common/utils/constant/constant';
import type { IPCUserExtensionEventsMap } from '#common/interface/ipc-events.interface';
import { contextBridge } from 'electron';
import type { BetterMessagePortSync, EventMapEmit } from '@repo/shared';
import { BetterMessagePort } from '@repo/shared';
import { createExtensionAPI } from '#common/utils/extension/extension-api-factory';
import IPCRenderer from '#common/utils/IPCRenderer';
import type { ExtensionBrowserTabContext } from '#common/interface/extension.interface';

function setExtView(type: 'empty' | 'error' = 'empty') {
  contextBridge.exposeInMainWorld(PRELOAD_API_KEY.extension, {
    $extView: type,
  });
}

class ExtensionAPI {
  static init() {
    window.addEventListener(
      'message',
      ({ ports }) => {
        const [port] = ports;
        if (!port) throw new Error('PORT IS EMPTY');

        new ExtensionAPI(port).loadAPI();
      },
      { once: true },
    );
  }

  private key: string = '';
  private commandId: string = '';
  private browserCtx: ExtensionBrowserTabContext = null;

  messagePort: BetterMessagePortSync<ExtensionMessagePortEvent>;

  constructor(messagePort: MessagePort) {
    this.messagePort = BetterMessagePort.createStandalone('sync', messagePort);
  }

  async loadAPI() {
    try {
      if (!window.location.href.startsWith(CUSTOM_SCHEME.extension))
        return setExtView();

      const { 0: extensionId, 2: commandId } = window.location.pathname
        .substring(2)
        .split('/');
      if (!extensionId || !commandId) return setExtView();

      this.commandId = commandId;

      const command = await IPCRenderer.invokeWithError(
        'database:get-command',
        { commandId, extensionId },
      );
      if (!command) throw new Error('Extension command not found');
      if (command.type !== 'view')
        throw new Error('Command is not a "view" type');

      const browserCtx = await IPCRenderer.invokeWithError(
        'browser:get-active-tab',
      );
      this.browserCtx = browserCtx;

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
      commandId: this.commandId,
      browserCtx: this.browserCtx,
    })) as any;
    if (typeof result === 'object' && result && '$isError' in result) {
      throw new Error(result.message);
    }

    return result;
  }
}

export default ExtensionAPI;
