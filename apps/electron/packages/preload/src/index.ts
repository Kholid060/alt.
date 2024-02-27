import { contextBridge } from 'electron';
import { setProperty } from 'dot-prop';
import * as mainPreload from './main';
import { ExtensionAPI } from './extension';
import { PRELOAD_API_KEY } from '../../common/utils/constant/constant';

(async () => {
  setProperty;
  try {
    if (process.isMainFrame) {
      contextBridge.exposeInMainWorld(PRELOAD_API_KEY.main, { ...mainPreload });
      return;
    }

    await new ExtensionAPI().loadAPI();
  } catch (error) {
    console.error(error);
  }
})();
