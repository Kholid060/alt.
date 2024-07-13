import { Module } from '@nestjs/common';
import { WorkflowController } from './workflow.controller';
import { WorkflowQueryService } from './workflow-query.service';
import { WorkflowService } from './workflow.service';
import { ExtensionQueryService } from '../extension/extension-query.service';
import { APIModule } from '../api/api.module';
import { WorkflowHistoryModule } from './workflow-history/workflow-history.module';

@Module({
  controllers: [WorkflowController],
  imports: [APIModule, WorkflowHistoryModule],
  exports: [WorkflowService, WorkflowQueryService],
  providers: [WorkflowService, WorkflowQueryService, ExtensionQueryService],
})
export class WorkflowModule {}
