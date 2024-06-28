import { Module } from '@nestjs/common';
import { WorkflowHistoryController } from './workflow-history.controller';
import { WorkflowHistoryService } from './workflow-history.service';

@Module({
  providers: [WorkflowHistoryService],
  controllers: [WorkflowHistoryController],
})
export class WorkflowHistoryModule {}
