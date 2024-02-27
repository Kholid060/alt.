import type { ExtensionManifest } from '@repo/extension-api';
import { flatActionExtensionAPI } from '@repo/extension-api/dist/flat-extension-api';
import {
  CUSTOM_SCHEME,
  PRELOAD_API_KEY,
} from '#common/utils/constant/constant';
import { sendIpcMessage } from '#common/utils/sendIpcMessage';
import type { IPCUserExtensionEventsMap } from '#common/interface/ipc-events';
import { contextBridge } from 'electron';
import { setProperty } from 'dot-prop';
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

  constructor() {}

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
      contextBridge.exposeInMainWorld(PRELOAD_API_KEY.extension, extensionApi);

      this.permissions = extensionData.manifest.permissions || [];
    } catch (error) {
      console.error(error);
      setExtView('error');
    }
  }

  async getExtensionAPI(
    manifest: ExtensionManifest,
  ): Promise<typeof _extension> {
    const extensionAPI: Record<string, unknown> = {};
    for (const key in flatActionExtensionAPI) {
      setProperty(
        extensionAPI,
        key,
        this.sendAction.bind(this, key as keyof IPCUserExtensionEventsMap),
      );
    }

    return {
      ...extensionAPI,
      manifest,
    } as typeof _extension;
  }

  private async sendAction<T extends keyof IPCUserExtensionEventsMap>(
    name: T,
    ...args: Parameters<IPCUserExtensionEventsMap[T]>
  ) {
    if (!isExtHasApiPermission(name, this.permissions)) {
      throw new ExtensionError("Doesn't have permission to access this API");
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
