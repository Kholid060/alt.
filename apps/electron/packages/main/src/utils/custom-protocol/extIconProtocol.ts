import fs from 'fs-extra';
import path from 'path';
import { EXTENSION_FOLDER } from '../constant';
import type { CustomProtocol } from './index';
import { CUSTOM_SCHEME } from '#common/utils/constant/constant';
import { net } from 'electron';

const appIconProtocol: CustomProtocol = {
  scheme: CUSTOM_SCHEME.extIcon,
  async handler(req) {
    const pathname = req.url.slice(`${CUSTOM_SCHEME.extIcon}://`.length);

    return net.fetch(EXTENSION_FOLDER + path.sep + pathname + '.png');
  },
};

export default appIconProtocol;
