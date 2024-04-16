import { createErrorResponse, type CustomProtocol } from './index';
import { CUSTOM_SCHEME } from '#common/utils/constant/constant';
import { net } from 'electron';
import { fileURLToPath } from 'url';
import ExtensionLoader from '../extension/ExtensionLoader';

const extensionFilePath = fileURLToPath(
  new URL('./../../extension/dist/', import.meta.url),
);

const devServer = import.meta.env.DEV && import.meta.env.VITE_DEV_SERVER_URL;

function handleCommandPath(extId: string, ...paths: string[]) {
  let path: string | null = '';

  const commandId = paths.shift();
  const type = paths.shift() || '';

  switch (type) {
    case '':
      path = extensionFilePath + 'index.html';
      break;
    // Main js file
    case '@preload':
      path = extensionFilePath + paths.join('/');
      break;
    case '@css': {
      path =
        typeof devServer === 'string'
          ? new URL('/src/assets/css/style.css?inline', devServer).href
          : extensionFilePath + 'main.css';
      break;
    }
    case '@fonts': {
      path =
        typeof devServer === 'string'
          ? new URL(`/src/assets/fonts/${paths.join('/')}`, devServer).href
          : extensionFilePath + paths.join('/');
      break;
    }
    case '@renderer':
      path = ExtensionLoader.instance.getPath(extId, 'base', `${commandId}.js`);
      break;
    case '@libs':
      path = ExtensionLoader.instance.getPath(extId, 'libs', paths[0]);
      break;
    default:
      path = `${extensionFilePath}${type}`;
  }

  if (!path) {
    return createErrorResponse({
      status: 404,
      code: 'not-found',
      message: 'Not found',
    });
  }

  return net.fetch(path);
}

const appIconProtocol: CustomProtocol = {
  scheme: CUSTOM_SCHEME.extension,
  async handler(req) {
    const [extId, type, ...paths] = req.url
      .substring(`${CUSTOM_SCHEME.extension}://`.length)
      .split('/');

    switch (type) {
      case 'icon': {
        const iconPath = ExtensionLoader.instance.getPath(
          extId,
          'icon',
          `${paths[0]}.png`,
        );
        console.log(iconPath);
        if (!iconPath) {
          return createErrorResponse({
            status: 404,
            code: 'not-found',
            message: 'Not found',
          });
        }

        return net.fetch(iconPath);
      }
      case 'command':
        return handleCommandPath(extId, ...paths);
      case '@preload':
        return net.fetch(`${extensionFilePath}${paths.join('/')}`);
    }

    return createErrorResponse({
      status: 404,
      code: 'not-found',
      message: 'Not found',
    });
  },
};

export default appIconProtocol;
