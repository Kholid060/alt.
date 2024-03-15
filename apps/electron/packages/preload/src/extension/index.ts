/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ExtensionManifest } from '@repo/extension-core';
import type { ExtensionMessagePortEvent } from '@repo/extension';
import extensionApiBuilder from '@repo/extension-core/dist/extensionApiBuilder';
import {
  CUSTOM_SCHEME,
  PRELOAD_API_KEY,
} from '#common/utils/constant/constant';
import { sendIpcMessage } from '#common/utils/sendIpcMessage';
import type { IPCUserExtensionEventsMap } from '#common/interface/ipc-events.interface';
import { contextBridge } from 'electron';
import { isExtHasApiPermission } from '#common/utils/check-ext-permission';
import type { SetRequired } from 'type-fest';
import { ExtensionError } from '#common/errors/ExtensionError';

function setExtView(type: 'empty' | 'error' = 'empty') {
  contextBridge.exposeInMainWorld(PRELOAD_API_KEY.extension, {
    $extView: type,
  });
}

export class ExtensionAPI {
  private key: string = '';
  private permissions: SetRequired<
    ExtensionManifest,
    'permissions'
  >['permissions'] = [];

  private messagePort: MessagePort | null = null;
  private messageListeners: Record<string, ((...args: any[]) => any)[]> = {};

  constructor() {
    window.addEventListener(
      'message',
      (event) => {
        const [port] = event.ports;
        if (!port) return;

        this.messagePort = port;
        port.addEventListener('message', this.onMessagePort.bind(this));
      },
      { once: true },
    );
  }

  private onMessagePort<T extends keyof ExtensionMessagePortEvent>({
    data,
  }: MessageEvent<{ name: T; data: ExtensionMessagePortEvent[T] }>) {
    switch (data.name) {
      case 'extension:query-change':
        this.emitMessageEvents('ui.searchPanel.onChanged', ...data.data);
        break;
      case 'extension:keydown-event':
        this.emitMessageEvents('ui.searchPanel.onKeydown', ...data.data);
        break;
    }
  }

  private emitMessageEvents(name: string, ...args: unknown[]) {
    const listeners = this.messageListeners[name];
    if (!listeners) return;

    listeners.forEach((listener) => listener(...args));
  }

  async loadAPI() {
    try {
      if (!window.location.href.startsWith(CUSTOM_SCHEME.extension))
        return setExtView();

      const { 0: extensionId, 2: commandId } = window.location.pathname
        .substring(2)
        .split('/');
      if (!extensionId || !commandId) return setExtView();

      const extensionData = await sendIpcMessage('extension:get', extensionId);
      if (!extensionData) return setExtView();
      if ('$isError' in extensionData) throw new Error(extensionData.message);

      this.key = extensionData.$key;

      const extensionApi = await this.getExtensionAPI(extensionData.manifest);
      contextBridge.exposeInMainWorld(PRELOAD_API_KEY.extension, {
        ...extensionApi,
        $commandId: commandId,
      });

      this.permissions = extensionData.manifest.permissions || [];
    } catch (error) {
      console.error(error);
      setExtView('error');
    }
  }

  private addEventHandler(key: string) {
    return {
      addListener: (callback: (...args: any[]) => void) => {
        if (!this.messageListeners[key]) {
          this.messageListeners[key] = [];
        }

        this.messageListeners[key].push(callback);
      },
      removeListener: (callback: (...args: any[]) => void) => {
        const listeners = this.messageListeners[key];
        if (!listeners) return;

        const index = listeners.indexOf(callback);
        if (index === -1) return;

        this.messageListeners[key].splice(index, 1);
      },
    };
  }

  async getExtensionAPI(
    manifest: ExtensionManifest,
  ): Promise<typeof _extension> {
    const extensionAPI = extensionApiBuilder({
      context: this,
      apiHandler: this.sendAction,
      values: {
        manifest,
        'ui.searchPanel.onChanged': this.addEventHandler(
          'ui.searchPanel.onChanged',
        ),
        'ui.searchPanel.onKeydown': this.addEventHandler(
          'ui.searchPanel.onKeydown',
        ),
        'shell.installedApps.getIconURL': (appId) =>
          `${CUSTOM_SCHEME.appIcon}://${appId}.png`,
      },
    });

    return Object.freeze(extensionAPI);
  }

  private async sendAction<T extends keyof IPCUserExtensionEventsMap>(
    name: T,
    ...args: Parameters<IPCUserExtensionEventsMap[T]>
  ) {
    if (!isExtHasApiPermission(name, this.permissions)) {
      throw new ExtensionError(
        `Doesn't have permission to access the "${name}" API`,
      );
    }

    const result = await sendIpcMessage('user-extension', {
      name,
      args,
      key: this.key,
    });
    if (typeof result === 'object' && '$isError' in result) {
      throw new Error(result.message);
    }

    return result;
  }
}
