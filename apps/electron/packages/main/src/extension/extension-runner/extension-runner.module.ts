import { Module } from '@nestjs/common';
import { ClipboardModule } from '/@/clipboard/clipboard.module';
import { DBModule } from '/@/db/db.module';
import { ExtensionLoaderModule } from '/@/extension-loader/extension-loader.module';
import { ExtensionConfigModule } from '../extension-config/extension-config.module';
import { BrowserExtensionModule } from '/@/browser-extension/browser-extension.module';
import { ExtensionRunnerService } from './extension-runner.service';
import { ExtensionRunnerController } from './extension-runner.controller';
import { ExtensionBrowserApiListener } from './listener/browser-api.listener';
import { ExtensionClipboardApiListener } from './listener/clipboard-api.listener';
import { ExtensionCommandApiListener } from './listener/command-api.listener';
import { ExtensionNotificationApiListener } from './listener/notification-api.listener';
import { ExtensionOAuthApiListener } from './listener/oauth-api.listener';
import { ExtensionRuntimeApiListener } from './listener/runtime-api.listener';
import { ExtensionShellApiListener } from './listener/shell-api.listener';
import { ExtensionSqliteApiListener } from './listener/sqlite-api.listener';
import { ExtensionStorageApiListener } from './listener/storage-api.listener';
import { ExtensionUIApiListener } from './listener/ui-api.listener';
import { ExtensionOAuthTokensModule } from '../extension-oauth-tokens/extension-oauth-tokens.module';
import { ExtensionSqliteModule } from '../extension-sqlite/extension-sqlite.module';
import { InstalledAppsModule } from '/@/installed-apps/installed-apps.module';
import { OAuthModule } from '/@/oauth/oauth.module';
import { ExtensionQueryService } from '../extension-query.service';
import { ExtensionStorageService } from '../extension-storage/extension-storage.service';
import { ExtensionRunnerExecutionService } from './extension-runner-execution.service';

const extensionApiListeners = [
  ExtensionUIApiListener,
  ExtensionOAuthApiListener,
  ExtensionShellApiListener,
  ExtensionSqliteApiListener,
  ExtensionCommandApiListener,
  ExtensionBrowserApiListener,
  ExtensionRuntimeApiListener,
  ExtensionStorageApiListener,
  ExtensionClipboardApiListener,
  ExtensionNotificationApiListener,
];

@Module({
  imports: [
    DBModule,
    OAuthModule,
    ClipboardModule,
    InstalledAppsModule,
    ExtensionConfigModule,
    ExtensionLoaderModule,
    ExtensionSqliteModule,
    BrowserExtensionModule,
    ExtensionOAuthTokensModule,
  ],
  exports: [ExtensionRunnerService],
  controllers: [ExtensionRunnerController],
  providers: [
    ExtensionQueryService,
    ExtensionRunnerService,
    ExtensionStorageService,
    ExtensionRunnerExecutionService,
    ...extensionApiListeners,
  ],
})
export class ExtensionRunnerModule {}
