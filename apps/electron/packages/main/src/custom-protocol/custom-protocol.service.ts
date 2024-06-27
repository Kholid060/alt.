import fs from 'fs-extra';
import { APP_ICON_DIR_PREFIX } from '#packages/common/utils/constant/app.const';
import { CUSTOM_SCHEME } from '#packages/common/utils/constant/constant';
import { Injectable } from '@nestjs/common';
import { app, net } from 'electron';
import InstalledApps from '../utils/InstalledApps';
import { createErrorResponse } from '../utils/custom-protocol/CustomProtocol';
import { ExtensionLoaderService } from '../extension-loader/extension-loader.service';
import { fileURLToPath } from 'url';

const extensionFilePath = fileURLToPath(
  new URL('./../../extension/dist/', import.meta.url),
);

const devServer = import.meta.env.DEV && import.meta.env.VITE_DEV_SERVER_URL;

@Injectable()
export class CustomProtocolService {
  constructor(private extensionLoader: ExtensionLoaderService) {}

  async handleFileIconProtocol(req: GlobalRequest) {
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
      status: 404,
      code: 'NOT_FOUND',
      message: 'Icon not found',
    });
  }

  async handleExtensionProtocol(req: GlobalRequest) {
    const [extId, type, ...paths] = req.url
      .substring(`${CUSTOM_SCHEME.extension}://`.length)
      .split('/');

    switch (type) {
      case 'icon': {
        const iconPath = await this.extensionLoader.getPath(
          extId,
          'icon',
          `${paths[0]}.png`,
        );
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
        return await this.handleCommandPath(extId, ...paths);
      case '@preload':
        return net.fetch(`${extensionFilePath}${paths.join('/')}`);
    }

    return createErrorResponse({
      status: 404,
      code: 'not-found',
      message: 'Not found',
    });
  }

  private async handleCommandPath(extId: string, ...paths: string[]) {
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
        path = await this.extensionLoader.getPath(
          extId,
          'base',
          `${commandId}.js`,
        );
        break;
      case '@libs':
        path = await this.extensionLoader.getPath(extId, 'libs', paths[0]);
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
}
