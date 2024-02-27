import type ExtensionAPI from '@repo/extension-core/types/extension-api';
import type * as MainPreload from './src/main';
import type { PRELOAD_API_KEY } from '../common/utils/constant/constant';

declare global {
  const _extension: typeof ExtensionAPI;

  const __mainAPI: typeof MainPreload;

  interface Window {
    [PRELOAD_API_KEY.main]: typeof MainPreload;
    [PRELOAD_API_KEY.extension]: typeof ExtensionAPI;
  }
}
