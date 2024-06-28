import { Module } from '@nestjs/common';
import { WorkflowController } from './workflow.controller';
import WorkflowService from '../services/workflow.service';
import { WorkflowQueryService } from './workflow-query.service';

@Module({
  exports: [WorkflowService],
  controllers: [WorkflowController],
  providers: [WorkflowService, WorkflowQueryService],
})
export class WorkflowModule {}
