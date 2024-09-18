import { Module } from '@nestjs/common';
import { ExtensionController } from './extension.controller';
import { ExtensionConfigModule } from './extension-config/extension-config.module';
import { ExtensionService } from './extension.service';
import { ExtensionLoaderModule } from '../extension-loader/extension-loader.module';
import { ExtensionCommandModule } from './extension-command/extension-command.module';
import { ExtensionCredentialModule } from './extension-credential/extension-credential.module';
import { ExtensionErrorModule } from './extension-error/extension-error.module';
import { ExtensionSqliteModule } from './extension-sqlite/extension-sqlite.module';
import { ExtensionAuthTokenService } from './extension-auth-token/extension-auth-token.service';
import { ExtensionStorageService } from './extension-storage/extension-storage.service';
import { ExtensionQueryService } from './extension-query.service';
import { ExtensionOAuthTokensModule } from './extension-oauth-tokens/extension-oauth-tokens.module';
import { APIService } from '../api/api.service';

@Module({
  exports: [ExtensionService, ExtensionSqliteModule, ExtensionQueryService],
  controllers: [ExtensionController],
  providers: [
    APIService,
    ExtensionService,
    ExtensionQueryService,
    ExtensionStorageService,
    ExtensionAuthTokenService,
  ],
  imports: [
    ExtensionErrorModule,
    ExtensionSqliteModule,
    ExtensionLoaderModule,
    ExtensionConfigModule,
    ExtensionCommandModule,
    ExtensionCredentialModule,
    ExtensionOAuthTokensModule,
  ],
})
export class ExtensionModule {}
