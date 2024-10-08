import path from 'path';
import { APP_ICON_DIR_PREFIX } from '#packages/common/utils/constant/app.const';
import { CUSTOM_SCHEME } from '#packages/common/utils/constant/constant';
import { Injectable } from '@nestjs/common';
import { app, nativeImage, NativeImage, nativeTheme, net } from 'electron';
import { ExtensionLoaderService } from '../extension-loader/extension-loader.service';
import { fileURLToPath } from 'url';
import { InstalledAppsService } from '../installed-apps/installed-apps.service';
import { createErrorResponse } from './utils/custom-protocol-utils';

const extensionFilePath = fileURLToPath(
  new URL('./../../extension/dist/', import.meta.url),
);
const rendererFilePath = fileURLToPath(
  new URL('./../../renderer/dist/', import.meta.url),
);
const assetsFilePath = fileURLToPath(new URL('./assets', import.meta.url));

@Injectable()
export class CustomProtocolService {
  constructor(
    private installedApps: InstalledAppsService,
    private extensionLoader: ExtensionLoaderService,
  ) {}

  private get devServer() {
    return process.env.VITE_DEV_SERVER_URL;
  }

  async handleFileIconProtocol(req: GlobalRequest) {
    const filePath = req.url.slice(`${CUSTOM_SCHEME.fileIcon}://`.length);
    let image: NativeImage | null = null;

    if (filePath.startsWith(APP_ICON_DIR_PREFIX)) {
      const appId = filePath.slice(APP_ICON_DIR_PREFIX.length + 1);
      image = await this.installedApps.getAppIcon(appId);
    } else {
      image = await app.getFileIcon(decodeURIComponent(filePath), {
        size: 'normal',
      });
    }

    if (!image) {
      return createErrorResponse({
        status: 404,
        message: 'Not found',
      });
    }

    if (image.isEmpty()) {
      image = nativeImage.createFromPath(
        path.join(
          assetsFilePath,
          nativeTheme.shouldUseDarkColors ? 'window@dark.png' : 'window.png',
        ),
      );
    }

    return new Response(image.toPNG());
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

  async handleImagePreview(req: GlobalRequest) {
    const filePath = decodeURIComponent(
      req.url.slice(`${CUSTOM_SCHEME.imagePreview}://`.length),
    );
    const img = await nativeImage
      .createThumbnailFromPath(filePath, {
        height: 256,
        width: 256,
      })
      .catch(() => null);

    return img
      ? new Response(img.toPNG())
      : createErrorResponse({ message: 'Not found', status: 404 });
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
        path = import.meta.env.DEV
          ? new URL('/src/assets/css/style.css?inline', this.devServer).href
          : rendererFilePath + 'style.css';
        break;
      }
      case '@fonts': {
        path = import.meta.env.DEV
          ? new URL(`/src/assets/fonts/${paths.join('/')}`, this.devServer).href
          : rendererFilePath + paths.join('/');
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
