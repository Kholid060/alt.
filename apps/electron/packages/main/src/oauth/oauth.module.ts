import { Module } from '@nestjs/common';
import { OAuthService } from './oauth.service';
import { ExtensionAuthTokenService } from '../extension/extension-auth-token/extension-auth-token.service';
import { ExtensionCredentialService } from '../extension/extension-credential/extension-credential.service';
import { OAuthController } from './oauth.controller';

@Module({
  exports: [OAuthService],
  controllers: [OAuthController],
  providers: [
    OAuthService,
    ExtensionAuthTokenService,
    ExtensionCredentialService,
  ],
})
export class OAuthModule {}
