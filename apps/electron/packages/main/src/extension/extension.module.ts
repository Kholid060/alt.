import { Module } from '@nestjs/common';
import { ExtensionController } from './extension.controller';
import { ExtensionConfigModule } from './extension-config/extension-config.module';
import { ExtensionService } from './extension.service';
import { ExtensionLoaderModule } from '../extension-loader/extension-loader.module';
import { BrowserExtensionModule } from '../browser-extension/browser-extension.module';
import { ExtensionCommandModule } from './extension-command/extension-command.module';
import { ExtensionCredentialModule } from './extension-credential/extension-credential.module';
import { ExtensionErrorModule } from './extension-error/extension-error.module';
import { ExtensionExecutionEventModule } from './extension-execution-event/extension-execution-event.module';
import { ExtensionSqliteModule } from './extension-sqlite/extension-sqlite.module';
import { ExtensionBrowserApiListener } from './extension-execution-event/listener/browser-api.listener';
import { ExtensionClipboardApiListener } from './extension-execution-event/listener/clipboard-api.listener';
import { ExtensionFSApiListener } from './extension-execution-event/listener/fs-api.listener';
import { ExtensionMainWindowApiListener } from './extension-execution-event/listener/main-window-api.listener';
import { ExtensionNotificationApiListener } from './extension-execution-event/listener/notification-api.listener';
import { ExtensionOAuthApiListener } from './extension-execution-event/listener/oauth-api.listener';
import { ExtensionRuntimeApiListener } from './extension-execution-event/listener/runtime-api.listener';
import { ExtensionShellApiListener } from './extension-execution-event/listener/shell-api.listener';
import { ExtensionSqliteApiListener } from './extension-execution-event/listener/sqlite-api.listener';
import { ExtensionStorageApiListener } from './extension-execution-event/listener/storage-api.listener';
import { OAuthModule } from '../oauth/oauth.module';
import { ExtensionAuthTokenService } from './extension-auth-token/extension-auth-token.service';
import { ExtensionStorageService } from './extension-storage/extension-storage.service';
import { ExtensionQueryService } from './extension-query.service';
import { ExtensionOAuthTokensModule } from './extension-oauth-tokens/extension-oauth-tokens.module';

const extensionApiListeners = [
  ExtensionFSApiListener,
  ExtensionOAuthApiListener,
  ExtensionShellApiListener,
  ExtensionSqliteApiListener,
  ExtensionBrowserApiListener,
  ExtensionRuntimeApiListener,
  ExtensionStorageApiListener,
  ExtensionClipboardApiListener,
  ExtensionMainWindowApiListener,
  ExtensionNotificationApiListener,
];

@Module({
  exports: [ExtensionService, ExtensionSqliteModule, ExtensionQueryService],
  controllers: [ExtensionController],
  providers: [
    ExtensionService,
    ExtensionQueryService,
    ExtensionStorageService,
    ExtensionAuthTokenService,
    ...extensionApiListeners,
  ],
  imports: [
    OAuthModule,
    ExtensionErrorModule,
    ExtensionSqliteModule,
    ExtensionLoaderModule,
    ExtensionConfigModule,
    ExtensionCommandModule,
    BrowserExtensionModule,
    ExtensionCredentialModule,
    ExtensionOAuthTokensModule,
    ExtensionExecutionEventModule,
  ],
})
export class ExtensionModule {}
