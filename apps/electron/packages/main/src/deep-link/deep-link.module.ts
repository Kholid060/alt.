import { Module } from '@nestjs/common';
import { DeepLinkService } from './deep-link.service';
import { DeepLinkListener } from './deep-link.listener';
import { WorkflowModule } from '../workflow/workflow.module';
import { ExtensionModule } from '../extension/extension.module';

@Module({
  exports: [DeepLinkService],
  imports: [WorkflowModule, ExtensionModule],
  providers: [DeepLinkService, DeepLinkListener],
})
export class DeepLinkModule {}
