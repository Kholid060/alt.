import { Module } from '@nestjs/common';
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
import { BrowserExtensionModule } from './browser-extension/browser-connection.module';

@Module({
  providers: [AppService],
  controllers: [AppController],
  imports: [
    DBModule,
    APIModule,
    StoreModule,
    LoggerModule,
    GlobalShortcutModule,
    ExtensionUpdaterModule,
    BrowserWindowModule,
    ExtensionLoaderModule,
    BrowserExtensionModule,
  ],
})
export class AppModule {}
