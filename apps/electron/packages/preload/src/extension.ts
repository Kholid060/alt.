import { ExtensionManifest } from '@repo/command-api';
import { EXTENSION_VIEW, PRELOAD_API_KEY } from '../../common/utils/constant/constant';
import { sendIpcMessage } from '../../common/utils/sendIpcMessage';
import { contextBridge } from 'electron';

async function initExtensionAPI(manifest: ExtensionManifest): Promise<typeof _extension> {
  return {
    manifest,
    tabs: {
      hello: 'a'
    }
  };
}

function setExtView(type: 'empty' | 'error' = 'empty') {
  contextBridge.exposeInMainWorld(PRELOAD_API_KEY.extension, {
    $extView: type,
  });
}

export async function loadExtensionAPI() {
  try {
    if (window.location.pathname !== EXTENSION_VIEW.path) return setExtView();

    const extensionQuery = new URLSearchParams(window.location.search).get(EXTENSION_VIEW.idQuery);
    if (!extensionQuery) return setExtView();

    const [extensionId, commandId] = extensionQuery.split('::');
    if (!extensionId || !commandId) return setExtView();

    const extensionData = await sendIpcMessage('extension:get', extensionId);
    if (!extensionData) return setExtView();

    const extensionApi = await initExtensionAPI(extensionData.manifest);
    contextBridge.exposeInMainWorld(PRELOAD_API_KEY.extension, extensionApi);
  } catch (error) {
    console.error(error);
    setExtView('error');
  }
}
