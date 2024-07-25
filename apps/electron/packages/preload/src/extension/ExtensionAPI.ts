/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  CUSTOM_SCHEME,
  PRELOAD_API_KEY,
} from '#common/utils/constant/constant';
import type { IPCUserExtensionEventsMap } from '#common/interface/ipc-events.interface';
import { contextBridge } from 'electron';
import IPCRenderer from '#common/utils/IPCRenderer';
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

        new ExtensionAPI(data.payload).loadAPI();
      },
      { once: true },
    );
  }

  private key: string = '';

  constructor(readonly payload: ExtensionCommandExecutePayload) {
    this.payload = payload;
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

      if (command.extension.isLocal) {
        const script = document.createElement('script');
        script.setAttribute('src', 'http://localhost:8097');
        document.body.appendChild(script);
      }

      this.key = extensionId;
      contextBridge.exposeInMainWorld('$$extIPC', this.sendAction.bind(this));
    } catch (error) {
      console.error(error);
      setExtView('error');
    }
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
