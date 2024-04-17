import { contextBridge } from 'electron';
import * as anu from 'electron';
import * as mainPreload from './main';
import { ExtensionAPI } from './extension';
import {
  CUSTOM_SCHEME,
  PRELOAD_API_KEY,
} from '../../common/utils/constant/constant';

(async () => {
  try {
    if (process.isMainFrame) {
      console.log(anu);
      contextBridge.exposeInMainWorld(PRELOAD_API_KEY.main, { ...mainPreload });
    } else if (window.location.href.startsWith(CUSTOM_SCHEME.extension)) {
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
  } catch (error) {
    console.error(error);
  }
})();
