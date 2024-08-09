import { Module } from '@nestjs/common';
import { ExtensionExecutionEventController } from './extension-execution-event.controller';
import { ExtensionExecutionEventService } from './extension-execution-event.service';
import { InstalledAppsModule } from '/@/installed-apps/installed-apps.module';
import { ExtensionQueryService } from '../extension-query.service';
import { ExtensionBrowserApiListener } from './listener/browser-api.listener';
import { ExtensionChildProcessApiListener } from './listener/child-process.listener';
import { ExtensionClipboardApiListener } from './listener/clipboard-api.listener';
import { ExtensionCommandApiListener } from './listener/command-api.listener';
import { ExtensionFSApiListener } from './listener/fs-api.listener';
import { ExtensionMainWindowApiListener } from './listener/main-window-api.listener';
import { ExtensionNotificationApiListener } from './listener/notification-api.listener';
import { ExtensionOAuthApiListener } from './listener/oauth-api.listener';
import { ExtensionRuntimeApiListener } from './listener/runtime-api.listener';
import { ExtensionShellApiListener } from './listener/shell-api.listener';
import { ExtensionSqliteApiListener } from './listener/sqlite-api.listener';
import { ExtensionStorageApiListener } from './listener/storage-api.listener';
import { ClipboardModule } from '/@/clipboard/clipboard.module';
import { ExtensionRunnerModule } from '../extension-runner/extension-runner.module';
import { OAuthModule } from '/@/oauth/oauth.module';
import { ExtensionOAuthTokensModule } from '../extension-oauth-tokens/extension-oauth-tokens.module';
import { ExtensionSqliteModule } from '../extension-sqlite/extension-sqlite.module';
import { ExtensionCommandModule } from '../extension-command/extension-command.module';
import { BrowserExtensionModule } from '/@/browser-extension/browser-extension.module';
import { ExtensionConfigModule } from '../extension-config/extension-config.module';
import { ExtensionStorageService } from '../extension-storage/extension-storage.service';
import { ExtensionLoaderModule } from '/@/extension-loader/extension-loader.module';

const extensionApiListeners = [
  ExtensionFSApiListener,
  ExtensionOAuthApiListener,
  ExtensionShellApiListener,
  ExtensionSqliteApiListener,
  ExtensionCommandApiListener,
  ExtensionBrowserApiListener,
  ExtensionRuntimeApiListener,
  ExtensionStorageApiListener,
  ExtensionClipboardApiListener,
  ExtensionMainWindowApiListener,
  ExtensionChildProcessApiListener,
  ExtensionNotificationApiListener,
];

@Module({
  imports: [
    OAuthModule,
    ClipboardModule,
    InstalledAppsModule,
    ExtensionRunnerModule,
    ExtensionSqliteModule,
    ExtensionConfigModule,
    ExtensionLoaderModule,
    ExtensionCommandModule,
    BrowserExtensionModule,
    ExtensionOAuthTokensModule,
  ],
  controllers: [ExtensionExecutionEventController],
  providers: [
    ExtensionQueryService,
    ExtensionStorageService,
    ExtensionExecutionEventService,
    ...extensionApiListeners,
  ],
})
export class ExtensionExecutionEventModule {}
