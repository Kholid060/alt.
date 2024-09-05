import { Module } from '@nestjs/common';
import { WorkflowRunnerService } from './workflow-runner.service';
import { WorkflowQueryService } from '../workflow/workflow-query.service';
import { WorkflowHistoryModule } from '../workflow/workflow-history/workflow-history.module';

@Module({
  exports: [WorkflowRunnerService],
  imports: [WorkflowHistoryModule],
  providers: [WorkflowRunnerService, WorkflowQueryService],
})
export class WorkflowRunnerModule {}
