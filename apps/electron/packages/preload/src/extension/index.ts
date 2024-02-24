import type { ExtensionManifest } from '@repo/command-api';
import { flatActionExtensionAPI } from '@repo/command-api/dist/flat-extension-api';
import {
  EXTENSION_VIEW,
  PRELOAD_API_KEY,
} from '../../../common/utils/constant/constant';
import { sendIpcMessage } from '../../../common/utils/sendIpcMessage';
import type { IPCUserExtensionEventsMap } from '../../../common/interface/ipc-events';
import { contextBridge } from 'electron';
import { setProperty } from 'dot-prop';

function setExtView(type: 'empty' | 'error' = 'empty') {
  contextBridge.exposeInMainWorld(PRELOAD_API_KEY.extension, {
    $extView: type,
  });
}

export class ExtensionAPI {
  private key: string = '';

  constructor() {}

  async loadAPI() {
    try {
      if (window.location.pathname !== EXTENSION_VIEW.path) return setExtView();

      const extensionQuery = new URLSearchParams(window.location.search).get(
        EXTENSION_VIEW.idQuery,
      );
      if (!extensionQuery) return setExtView();

      const [extensionId, commandId] = extensionQuery.split('::');
      if (!extensionId || !commandId) return setExtView();

      const extensionData = await sendIpcMessage('extension:get', extensionId);
      if (!extensionData) return setExtView();

      this.key = extensionData.$key;

      const extensionApi = await this.getExtensionAPI(extensionData.manifest);
      contextBridge.exposeInMainWorld(PRELOAD_API_KEY.extension, extensionApi);
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

  private sendAction<T extends keyof IPCUserExtensionEventsMap>(
    name: T,
    ...args: Parameters<IPCUserExtensionEventsMap[T]>
  ) {
    return sendIpcMessage('user-extension', { key: this.key, name, args });
  }
}
