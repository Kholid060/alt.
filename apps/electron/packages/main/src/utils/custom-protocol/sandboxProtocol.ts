import fs from 'fs-extra';
import {
  createErrorResponse,
  type CustomProtocolHandler,
} from './CustomProtocol';
import { CUSTOM_SCHEME } from '#common/utils/constant/constant';
import { join } from 'path';
import { fileURLToPath } from 'url';

const basePath = fileURLToPath(new URL('./../../shared/dist', import.meta.url));

const sandboxProtocol: CustomProtocolHandler = {
  scheme: CUSTOM_SCHEME.sandbox,
  async handler(req) {
    const paths = req.url.slice(`${CUSTOM_SCHEME.sandbox}://`.length);
    const [host, path] = paths.split('/');

    if (host === 'sandbox') {
      if (!path) {
        return new Response(await fs.readFile(join(basePath, '/sandbox.html')));
      }
      if (path === 'script') {
        return new Response(await fs.readFile(join(basePath, '/sandbox.js')));
      }
    }

    return createErrorResponse({
      message: 'File not found',
      code: 'NOT_FOUND',
      status: 404,
    });
  },
};

export default sandboxProtocol;
