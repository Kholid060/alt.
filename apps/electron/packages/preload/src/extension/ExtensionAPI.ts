/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ExtensionManifest } from '@repo/extension-core';
import type { ExtensionMessagePortEvent } from '@repo/extension';
import extensionApiBuilder from '@repo/extension-core/dist/extensionApiBuilder';
import {
  CUSTOM_SCHEME,
  PRELOAD_API_KEY,
} from '#common/utils/constant/constant';
import type { IPCUserExtensionEventsMap } from '#common/interface/ipc-events.interface';
import { contextBridge } from 'electron';
import { isExtHasApiPermission } from '#common/utils/check-ext-permission';
import type { SetRequired } from 'type-fest';
import { ExtensionError } from '#common/errors/custom-errors';
import type { BetterMessagePortSync, EventMapEmit } from '@repo/shared';
import { BetterMessagePort } from '@repo/shared';
import {
  extensionAPIBrowser,
  extensionAPIGetIconURL,
  extensionAPISearchPanelEvent,
  extensionAPIUiToast,
} from '#common/utils/extension/extension-api-value';
import IPCRenderer from '../../../common/utils/IPCRenderer';

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
  private permissions: SetRequired<
    ExtensionManifest,
    'permissions'
  >['permissions'] = [];

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

      const extensionManifest = await IPCRenderer.invoke(
        'database:get-extension-manifest',
        extensionId,
      );
      if (extensionManifest && '$isError' in extensionManifest)
        throw new Error(extensionManifest.message);
      if (!extensionManifest) return setExtView();

      this.key = extensionId;

      const extensionApi = await this.getExtensionAPI(extensionManifest);
      contextBridge.exposeInMainWorld(PRELOAD_API_KEY.extension, {
        ...extensionApi,
        $commandId: commandId,
      });

      this.permissions = extensionManifest.permissions || [];
    } catch (error) {
      console.error(error);
      setExtView('error');
    }
  }

  async getExtensionAPI(
    manifest: ExtensionManifest,
  ): Promise<typeof _extension> {
    const extensionAPI = extensionApiBuilder({
      context: this,
      apiHandler: this.sendAction,
      values: {
        manifest,
        ...extensionAPIGetIconURL(),
        ...extensionAPIUiToast(this.messagePort),
        ...extensionAPISearchPanelEvent(this.messagePort),
        ...extensionAPIBrowser(
          this.sendAction.bind(this) as EventMapEmit<IPCUserExtensionEventsMap>,
        ),
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

    const result = (await IPCRenderer.invoke('user-extension', {
      name,
      args,
      key: this.key,
      commandId: this.commandId,
    })) as any;
    if (typeof result === 'object' && result && '$isError' in result) {
      throw new Error(result.message);
    }

    return result;
  }
}

export default ExtensionAPI;
