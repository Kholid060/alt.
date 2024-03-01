import fs from 'fs-extra';
import type { CustomProtocol } from './index';
import { APP_ICON_DIR } from '../constant';
import path from 'path';
import { CUSTOM_SCHEME } from '#common/utils/constant/constant';

const appIconProtocol: CustomProtocol = {
  scheme: CUSTOM_SCHEME.appIcon,
  async handler(req) {
    const { hostname } = new URL(req.url);
    const file = await fs.readFile(APP_ICON_DIR + path.sep + hostname);

    return new Response(file, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
      },
    });
  },
};

export default appIconProtocol;
