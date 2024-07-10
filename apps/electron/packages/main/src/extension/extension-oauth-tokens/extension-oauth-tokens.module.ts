import { Module } from '@nestjs/common';
import { ExtensionOAuthTokensService } from './extension-oauth-tokens.service';
import { ExtensionOAuthTokensController } from './extension-oauth-tokens.controller';

@Module({
  exports: [ExtensionOAuthTokensService],
  providers: [ExtensionOAuthTokensService],
  controllers: [ExtensionOAuthTokensController],
})
export class ExtensionOAuthTokensModule {}
