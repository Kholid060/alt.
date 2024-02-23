import * as MainPreload from './src/main';
import { PRELOAD_API_KEY } from '#common/utils/constant/constant';

declare global {
  interface Window {
    [PRELOAD_API_KEY.main]: typeof MainPreload;
  }
}
