import { EXTENSION_FOLDER, EXTENSION_LOCAL_ID_PREFIX } from '../constant';
import { createErrorResponse, type CustomProtocol } from './index';
import { CUSTOM_SCHEME } from '#common/utils/constant/constant';
import { net } from 'electron';
import { fileURLToPath } from 'url';
import { store } from '/@/lib/store';

const extensionFilePath = fileURLToPath(
  new URL('./../../extension/dist/', import.meta.url),
);

const devServer = import.meta.env.DEV && import.meta.env.VITE_DEV_SERVER_URL;

function getExtensionFolder(extensionId: string) {
  let extensionFolderDir = `${EXTENSION_FOLDER}/${extensionId}/icon`;
  if (extensionId.startsWith(EXTENSION_LOCAL_ID_PREFIX)) {
    extensionFolderDir = store.get(`localExtensions.${extensionId}.path`, '');
  }

  return extensionFolderDir;
}
function handleCommandPath(extId: string, ...paths: string[]) {
  let path: string = '';

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
      path = `${getExtensionFolder(extId)}/${commandId}.js`;
      break;
    case '@libs':
      path = `${getExtensionFolder(extId)}/@libs/${paths[0]}`;
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
        return net.fetch(`${getExtensionFolder(extId)}/icon/${paths[0]}.png`);
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
