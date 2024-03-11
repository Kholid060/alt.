import fs from 'fs-extra';
import { createErrorResponse, type CustomProtocol } from './index';
import { APP_ICON_DIR } from '../constant';
import path from 'path';
import { CUSTOM_SCHEME } from '#common/utils/constant/constant';

const appIconProtocol: CustomProtocol = {
  scheme: CUSTOM_SCHEME.appIcon,
  async handler(req) {
    const { hostname } = new URL(req.url);
    const iconPath = APP_ICON_DIR + path.sep + hostname;

    if (!fs.existsSync(iconPath))
      return createErrorResponse({
        message: 'Icon not found',
        code: 'NOT_FOUND',
        status: 404,
      });

    const file = await fs.readFile(iconPath);

    return new Response(file, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
      },
    });
  },
};

export default appIconProtocol;
