import { contextBridge, webFrame } from 'electron';
import * as mainPreload from './main';
import { loadExtensionAPI } from './extension';
import { PRELOAD_API_KEY, EXTENSION_VIEW } from '../../common/utils/constant/constant';

(async () => {
  try {
    if (process.isMainFrame) {
      contextBridge.exposeInMainWorld(PRELOAD_API_KEY.main, { ...mainPreload });
      return;
    }

    await loadExtensionAPI();
  } catch (error) {
    console.error(error);
  }
})();
