import { Module } from '@nestjs/common';
import { DeepLinkService } from './deep-link.service';
import { WorkflowModule } from '../workflow/workflow.module';
import { ExtensionModule } from '../extension/extension.module';
import { OAuthModule } from '../oauth/oauth.module';

@Module({
  exports: [DeepLinkService],
  providers: [DeepLinkService],
  imports: [WorkflowModule, ExtensionModule, OAuthModule],
})
export class DeepLinkModule {}
