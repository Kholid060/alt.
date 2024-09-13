import { Controller } from '@nestjs/common';
import { WorkflowHistoryService } from './workflow-history.service';
import { IPCInvoke } from '/@/common/decorators/ipc.decorator';
import { Payload } from '@nestjs/microservices';
import type {
  IPCInvokePayload,
  IPCInvokeReturn,
} from '#packages/common/interface/ipc-events.interface';

@Controller()
export class WorkflowHistoryController {
  constructor(private workflowHistory: WorkflowHistoryService) {}

  @IPCInvoke('database:get-workflow-history-list')
  listPagination(
    @Payload() [filter]: IPCInvokePayload<'database:get-workflow-history-list'>,
  ): IPCInvokeReturn<'database:get-workflow-history-list'> {
    return this.workflowHistory.listHistoryPagination(filter);
  }

  @IPCInvoke('database:get-workflow-history')
  getHistory(
    @Payload() [id]: IPCInvokePayload<'database:get-workflow-history'>,
  ): IPCInvokeReturn<'database:get-workflow-history'> {
    return this.workflowHistory.get(id);
  }

  @IPCInvoke('database:insert-workflow-history')
  async insertHistory(
    @Payload() [payload]: IPCInvokePayload<'database:insert-workflow-history'>,
  ): IPCInvokeReturn<'database:insert-workflow-history'> {
    const [value] = await this.workflowHistory.insertHistory(payload);
    return value.id;
  }

  @IPCInvoke('database:update-workflow-history')
  async updateHistory(
    @Payload()
    [historyId, payload]: IPCInvokePayload<'database:update-workflow-history'>,
  ): IPCInvokeReturn<'database:update-workflow-history'> {
    await this.workflowHistory.updateHistory(historyId, payload);
  }

  @IPCInvoke('database:delete-workflow-history')
  async deleteHistory(
    @Payload()
    [historyId]: IPCInvokePayload<'database:delete-workflow-history'>,
  ): IPCInvokeReturn<'database:delete-workflow-history'> {
    await this.workflowHistory.deleteHistory(historyId);
  }

  @IPCInvoke('database:get-running-workflows')
  listRunningWorkflows(
    @Payload()
    [filter]: IPCInvokePayload<'database:get-running-workflows'>,
  ): IPCInvokeReturn<'database:get-running-workflows'> {
    return this.workflowHistory.listRunningWorkflows(filter);
  }

  @IPCInvoke('workflow-history:get-log')
  getLog(
    @Payload() [runnerId]: IPCInvokePayload<'workflow-history:get-log'>,
  ): IPCInvokeReturn<'workflow-history:get-log'> {
    return this.workflowHistory.getLog(runnerId);
  }
}
