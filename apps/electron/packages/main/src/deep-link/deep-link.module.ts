import { Module } from '@nestjs/common';
import { DeepLinkService } from './deep-link.service';
import { WorkflowModule } from '../workflow/workflow.module';
import { OAuthModule } from '../oauth/oauth.module';
import { ExtensionRunnerModule } from '../extension/extension-runner/extension-runner.module';

@Module({
  exports: [DeepLinkService],
  providers: [DeepLinkService],
  imports: [WorkflowModule, ExtensionRunnerModule, OAuthModule],
})
export class DeepLinkModule {}
