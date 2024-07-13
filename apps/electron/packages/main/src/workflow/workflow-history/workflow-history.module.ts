import { Module } from '@nestjs/common';
import { WorkflowHistoryController } from './workflow-history.controller';
import { WorkflowHistoryService } from './workflow-history.service';

@Module({
  exports: [WorkflowHistoryService],
  providers: [WorkflowHistoryService],
  controllers: [WorkflowHistoryController],
})
export class WorkflowHistoryModule {}
