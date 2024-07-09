import type ExtensionAPI from '@altdot/extension/types/extension-api';
import type * as MainPreload from './src/main/main-api';
import type { PRELOAD_API_KEY } from '../common/utils/constant/constant';

declare global {
  const __mainAPI: typeof MainPreload;

  const _extension: typeof ExtensionAPI & { $commandId: string };

  interface Window {
    [PRELOAD_API_KEY.main]: typeof __mainAPI;
    [PRELOAD_API_KEY.extension]: typeof _extension;
  }
}
