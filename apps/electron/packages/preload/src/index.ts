import { contextBridge } from 'electron';
import * as mainPreload from './main';
import { ExtensionAPI } from './extension';
import {
  CUSTOM_SCHEME,
  PRELOAD_API_KEY,
} from '../../common/utils/constant/constant';

(async () => {
  try {
    if (process.isMainFrame) {
      contextBridge.exposeInMainWorld(PRELOAD_API_KEY.main, { ...mainPreload });
    } else if (window.location.href.startsWith(CUSTOM_SCHEME.extension)) {
      await new ExtensionAPI().loadAPI();
    }
  } catch (error) {
    console.error(error);
  }
})();
