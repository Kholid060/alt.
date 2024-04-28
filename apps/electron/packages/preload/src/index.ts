import { contextBridge } from 'electron';
import * as mainPreload from './main/main-api';
import ExtensionAPI from './extension/ExtensionAPI';
import {
  CUSTOM_SCHEME,
  PRELOAD_API_KEY,
} from '../../common/utils/constant/constant';

if (process.isMainFrame) {
  contextBridge.exposeInMainWorld(PRELOAD_API_KEY.main, { ...mainPreload });
} else if (window.location.href.startsWith(CUSTOM_SCHEME.extension)) {
  ExtensionAPI.init();
}
