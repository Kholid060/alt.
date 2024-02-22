import { contextBridge } from 'electron';
import * as mainPreload from './main';
import * as sandboxPreload from './extension';
import { PRELOAD_API_KEY, EXTENSION_VIEW } from '../../common/utils/constant/constant';

function loadExtensionAPI() {
  if (window.location.pathname !== EXTENSION_VIEW.path) return;

  const extensionId = new URLSearchParams(window.location.search).get(EXTENSION_VIEW.idQuery);
  if (!extensionId) return;

  console.log(extensionId);
  contextBridge.exposeInMainWorld(PRELOAD_API_KEY.extension, { ...sandboxPreload, extId: extensionId });

}

if (process.isMainFrame) {
  contextBridge.exposeInMainWorld(PRELOAD_API_KEY.main, { ...mainPreload });
} else {
  loadExtensionAPI();
}
