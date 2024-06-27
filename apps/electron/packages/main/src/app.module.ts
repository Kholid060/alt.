import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { AppService } from './app.service';
import { AppController } from './app.controller';
import { StoreModule } from './store/store.module';
import { ExtensionUpdaterModule } from './extension-updater/extension-updater.module';
import { DBModule } from './db/db.module';
import { LoggerModule } from './logger/logger.module';
import { APIModule } from './api/api.module';
import { GlobalShortcutModule } from './global-shortcut/global-shortcut.module';
import { BrowserWindowModule } from './browser-window/browser-window.module';
import { ExtensionLoaderModule } from './extension-loader/extension-loader.module';
import { BrowserExtensionModule } from './browser-extension/browser-extension.module';
import { ExtensionModule } from './extension/extension.module';
import { ExtensionConfigModule } from './extension/extension-config/extension-config.module';
import { CustomProtocolModule } from './custom-protocol/custom-protocol.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { TrayMenuModule } from './tray-menu/tray-menu.module';

@Module({
  providers: [AppService],
  controllers: [AppController],
  imports: [
    CacheModule.register({
      isGlobal: true,
    }),
    EventEmitterModule.forRoot({
      ignoreErrors: false,
    }),
    DBModule,
    APIModule,
    StoreModule,
    LoggerModule,
    TrayMenuModule,
    ExtensionModule,
    BrowserWindowModule,
    CustomProtocolModule,
    GlobalShortcutModule,
    ExtensionLoaderModule,
    ExtensionConfigModule,
    ExtensionUpdaterModule,
    BrowserExtensionModule,
  ],
})
export class AppModule {}
