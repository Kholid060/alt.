import * as MainPreload from './src/main';
import * as ExtensionPreload from './src/extension';
import { PRELOAD_API_KEY } from '#common/utils/constant/constant';

declare global {
  interface Window {
    [PRELOAD_API_KEY.main]: typeof MainPreload;
    [PRELOAD_API_KEY.extension]: typeof ExtensionPreload;
  }
}
