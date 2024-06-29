import { Module } from '@nestjs/common';
import { WorkflowController } from './workflow.controller';
import { WorkflowQueryService } from './workflow-query.service';
import { WorkflowService } from './workflow.service';

@Module({
  controllers: [WorkflowController],
  exports: [WorkflowService, WorkflowQueryService],
  providers: [WorkflowService, WorkflowQueryService],
})
export class WorkflowModule {}
