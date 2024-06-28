import { Controller } from '@nestjs/common';
import WorkflowService from '../services/workflow.service';
import { WorkflowQueryService } from './workflow-query.service';
import { IPCInvoke } from '../common/decorators/ipc.decorator';
import { Payload } from '@nestjs/microservices';
import type {
  IPCInvokePayload,
  IPCInvokeReturn,
} from '#packages/common/interface/ipc-events.interface';

@Controller()
export class WorkflowController {
  constructor(
    private workflow: WorkflowService,
    private workflowQuery: WorkflowQueryService,
  ) {}

  @IPCInvoke('database:delete-workflow')
  async deleteWorkflow(
    @Payload() [workflowId]: IPCInvokePayload<'database:delete-workflow'>,
  ): IPCInvokeReturn<'database:delete-workflow'> {
    // eslint-disable-next-line drizzle/enforce-delete-with-where
    await this.workflowQuery.delete(workflowId);
  }

  @IPCInvoke('database:get-workflow')
  getWorkflow(
    @Payload() [workflowId]: IPCInvokePayload<'database:get-workflow'>,
  ): IPCInvokeReturn<'database:get-workflow'> {
    return this.workflowQuery.get(workflowId);
  }

  @IPCInvoke('database:insert-workflow')
  async insertWorkflow(
    @Payload() [payload]: IPCInvokePayload<'database:insert-workflow'>,
  ): IPCInvokeReturn<'database:insert-workflow'> {
    const [value] = await this.workflowQuery.insert(payload);
    return value.id;
  }

  @IPCInvoke('database:update-workflow')
  async updateWorkflow(
    @Payload()
    [workflowId, payload]: IPCInvokePayload<'database:update-workflow'>,
  ): IPCInvokeReturn<'database:update-workflow'> {
    await this.workflowQuery.update(workflowId, payload);
  }

  @IPCInvoke('database:get-workflow-list')
  async listWorkflow(
    @Payload()
    [filter]: IPCInvokePayload<'database:get-workflow-list'>,
  ): IPCInvokeReturn<'database:get-workflow-list'> {
    return this.workflowQuery.listWorkflow(filter);
  }
}
