import { Module } from '@nestjs/common';
import { DeepLinkService } from './deep-link.service';
import { OAuthModule } from '../oauth/oauth.module';
import { ExtensionRunnerModule } from '../extension/extension-runner/extension-runner.module';
import { WorkflowRunnerModule } from '../workflow-runner/workflow-runner.module';

@Module({
  exports: [DeepLinkService],
  providers: [DeepLinkService],
  imports: [WorkflowRunnerModule, ExtensionRunnerModule, OAuthModule],
})
export class DeepLinkModule {}
