import { Module } from '@nestjs/common';
import { OAuthService } from './oauth.service';
import { OAuthController } from './oauth.controller';
import { ExtensionCredentialService } from '../extension/extension-credential/extension-credential.service';
import { ExtensionOAuthTokensModule } from '../extension/extension-oauth-tokens/extension-oauth-tokens.module';

@Module({
  exports: [OAuthService],
  controllers: [OAuthController],
  imports: [ExtensionOAuthTokensModule],
  providers: [OAuthService, ExtensionCredentialService],
})
export class OAuthModule {}
