import os from 'os';
import { app } from 'electron';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { MessagePortChannelIds } from '#packages/common/interface/message-port-events.interface';
import { MESSAGE_PORT_CHANNEL_IDS } from '#packages/common/utils/constant/constant';
import { BrowserWindowService } from './browser-window/browser-window.service';
import { AppMessagePortBridgeOptions } from '#packages/common/interface/app.interface';
import { AppStoreService } from './app/app-store/app-store.service';
import { ExtensionLoaderService } from './extension-loader/extension-loader.service';
import { ConfigService } from '@nestjs/config';
import { AppEnv } from './common/validation/app-env.validation';

@Injectable()
export class AppService implements OnModuleInit {
  constructor(
    private appStore: AppStoreService,
    private config: ConfigService<AppEnv, true>,
    private browserWindow: BrowserWindowService,
    private extensionLoader: ExtensionLoaderService,
  ) {}

  async onModuleInit() {
    const isFirstTime = await this.appStore.get('isFirstTime', true);
    if (!isFirstTime) return;

    this.extensionLoader.installDefaultExtensions(
      this.config.get('INITIAL_EXT_IDS'),
    );

    await this.appStore.set('isFirstTime', false);
  }

  getVersion() {
    return {
      $isError: false,
      app: app.getVersion(),
      os: `${process.platform}@${os.release()}`,
    };
  }

  async messagePortBridge(
    ports: Electron.MessagePortMain[],
    channelId: MessagePortChannelIds,
    _options?: AppMessagePortBridgeOptions,
  ) {
    if (ports.length === 0) return;

    switch (channelId) {
      case MESSAGE_PORT_CHANNEL_IDS.sharedWithCommand: {
        const windowCommand = await this.browserWindow.getOrCreate('command');
        windowCommand.postMessage('message-port:created', { channelId }, ports);
        break;
      }
    }
  }
}
