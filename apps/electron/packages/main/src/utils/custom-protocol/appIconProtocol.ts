import fs from 'fs-extra';
import type { CustomProtocol } from './index';
import { APP_ICON_DIR } from '../constant';
import path from 'path';

const appIconProtocol: CustomProtocol = {
  scheme: 'app-icon',
  async handler(req) {
    const { hostname } = new URL(req.url);
    const file = await fs.readFile(APP_ICON_DIR + path.sep + hostname);

    return new Response(file, {
      status: 200,
      headers: {
        type: 'image/png',
      },
    });
  },
};

export default appIconProtocol;
