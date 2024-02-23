import { EXTENSION_FOLDER } from '../constant';
import type { CustomProtocol } from './index';
import { CUSTOM_SCHEME } from '#common/utils/constant/constant';
import { net } from 'electron';


const appIconProtocol: CustomProtocol = {
  scheme: CUSTOM_SCHEME.extIcon,
  async handler(req) {
    const { hostname, pathname } = new URL(req.url);

    return net.fetch(
      `${EXTENSION_FOLDER}/${hostname}/icon/${pathname.substring(1)}.png`
    );
  },
};

export default appIconProtocol;
