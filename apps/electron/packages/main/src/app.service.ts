import os from 'os';
import { app, dialog } from 'electron';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { MessagePortChannelIds } from '#packages/common/interface/message-port-events.interface';
import { MESSAGE_PORT_CHANNEL_IDS } from '#packages/common/utils/constant/constant';
import { BrowserWindowService } from './browser-window/browser-window.service';
import { AppMessagePortBridgeOptions } from '#packages/common/interface/app.interface';
import { AppStoreService } from './app/app-store/app-store.service';
import { ExtensionLoaderService } from './extension-loader/extension-loader.service';
import { ConfigService } from '@nestjs/config';
import { AppEnv } from './common/validation/app-env.validation';
import updater from 'electron-updater';
import { OnAppReady } from './common/hooks/on-app-ready.hook';
import { LoggerService } from './logger/logger.service';

@Injectable()
export class AppService implements OnModuleInit, OnAppReady {
  constructor(
    private logger: LoggerService,
    private appStore: AppStoreService,
    private config: ConfigService<AppEnv, true>,
    private browserWindow: BrowserWindowService,
    private extensionLoader: ExtensionLoaderService,
  ) {}

  onAppReady() {
    updater.autoUpdater.addListener('update-not-available', () => {
      dialog.showMessageBox({ message: 'No update available' });
    });
    updater.autoUpdater.addListener('error', (error) => {
      dialog.showMessageBox({ message: 'Error when checking update' });
      this.logger.error(['app', 'check-update'], error.message);
    });
  }

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

  checkUpdate() {
    updater.autoUpdater.checkForUpdatesAndNotify();
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
