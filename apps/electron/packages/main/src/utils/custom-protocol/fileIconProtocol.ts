import fs from 'fs-extra';
import { createErrorResponse, type CustomProtocol } from './index';
import {
  APP_ICON_DIR_PREFIX,
  CUSTOM_SCHEME,
} from '#common/utils/constant/constant';
import { app } from 'electron';
import InstalledApps from '../InstalledApps';

const appIconProtocol: CustomProtocol = {
  scheme: CUSTOM_SCHEME.fileIcon,
  async handler(req) {
    const filePath = req.url.slice(`${CUSTOM_SCHEME.fileIcon}://`.length);

    if (filePath.startsWith(APP_ICON_DIR_PREFIX)) {
      const appId = filePath.slice(APP_ICON_DIR_PREFIX.length + 1);
      const appIcon = await InstalledApps.instance.getAppIcon(appId);
      if (appIcon) return new Response(appIcon.toPNG());
    } else if (!fs.existsSync(filePath)) {
      const fileIcon = await app.getFileIcon(filePath, { size: 'normal' });
      return new Response(fileIcon.toPNG());
    }

    return createErrorResponse({
      message: 'Icon not found',
      code: 'NOT_FOUND',
      status: 404,
    });
  },
};

export default appIconProtocol;
