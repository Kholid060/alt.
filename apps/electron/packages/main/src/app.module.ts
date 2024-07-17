import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { AppService } from './app.service';
import { AppController } from './app.controller';
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
import { InstalledAppsModule } from './installed-apps/installed-apps.module';
import { OAuthModule } from './oauth/oauth.module';
import { WorkflowModule } from './workflow/workflow.module';
import { WorkflowHistoryModule } from './workflow/workflow-history/workflow-history.module';
import { ConfigModule } from '@nestjs/config';
import { z } from 'zod';
import { AppBackupModule } from './app/app-backup/app-backup.module';
import { AppStoreModule } from './app/app-store/app-store.module';
import { AppCryptoModule } from './app/app-crypto/app-crypto.module';
import { ElectronApiModule } from './electron-api/electron-api.module';
import { DeepLinkModule } from './deep-link/deep-link.module';
import { app } from 'electron';
import { WebAppModule } from './web-app/web-app.module';
import { envConfig } from './common/config/env.config';

const envVarsSchema = z.object({
  API_KEY: z.string().min(1),
  SECRET_DATA_KEY: z.string().min(32),
  VITE_DEV_SERVER_URL: z.string().optional(),
  VITE_WEB_BASE_URL: z.string().url().min(1),
  VITE_API_BASE_URL: z.string().url().min(1),
  WS_ALLOWED_ORIGIN: z
    .string()
    .min(1)
    .transform((value) => value.split(',').map((str) => str.trim())),
});

@Module({
  providers: [AppService],
  controllers: [AppController],
  imports: [
    CacheModule.register({
      isGlobal: true,
    }),
    EventEmitterModule.forRoot({
      delimiter: ':',
    }),
    ConfigModule.forRoot({
      cache: true,
      isGlobal: true,
      ...(import.meta.env.DEV
        ? {}
        : { ignoreEnvFile: true, ignoreEnvVars: true }),
      validate: (config) => {
        const isSingleInstance = app.requestSingleInstanceLock();
        if (!isSingleInstance) return {};

        return envVarsSchema.parse(
          import.meta.env.DEV ? { ...process.env, ...config } : envConfig(),
        );
      },
    }),
    AppStoreModule,
    AppCryptoModule,
    AppBackupModule,
    DBModule,
    APIModule,
    OAuthModule,
    LoggerModule,
    WebAppModule,
    TrayMenuModule,
    WorkflowModule,
    DeepLinkModule,
    ExtensionModule,
    ElectronApiModule,
    BrowserWindowModule,
    InstalledAppsModule,
    CustomProtocolModule,
    GlobalShortcutModule,
    ExtensionLoaderModule,
    WorkflowHistoryModule,
    ExtensionConfigModule,
    ExtensionUpdaterModule,
    BrowserExtensionModule,
  ],
})
export class AppModule {}
