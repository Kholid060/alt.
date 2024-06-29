import { Controller } from '@nestjs/common';
import { WorkflowQueryService } from './workflow-query.service';
import { IPCInvoke } from '../common/decorators/ipc.decorator';
import { Ctx, Payload } from '@nestjs/microservices';
import type {
  IPCInvokePayload,
  IPCInvokeReturn,
} from '#packages/common/interface/ipc-events.interface';
import { WorkflowService } from './workflow.service';
import { BrowserWindow } from 'electron';

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

  @IPCInvoke('workflow:stop-running')
  async stopRunningWorkflow(
    @Payload()
    [filter]: IPCInvokePayload<'workflow:stop-running'>,
  ): IPCInvokeReturn<'workflow:stop-running'> {
    await this.workflow.stopRunningWorkflow(filter);
  }

  @IPCInvoke('workflow:execute')
  async executeWorklfow(
    @Payload()
    [payload]: IPCInvokePayload<'workflow:execute'>,
  ): IPCInvokeReturn<'workflow:execute'> {
    return this.workflow.execute(payload);
  }

  @IPCInvoke('workflow:export')
  async exportWorklfow(
    @Payload()
    [payload]: IPCInvokePayload<'workflow:export'>,
    @Ctx() event: Electron.IpcMainInvokeEvent,
  ): IPCInvokeReturn<'workflow:export'> {
    return this.workflow.exportToFile(
      payload,
      undefined,
      BrowserWindow.fromWebContents(event.sender),
    );
  }

  @IPCInvoke('workflow:import')
  async importWorklfow(
    @Payload()
    [workflowId]: IPCInvokePayload<'workflow:import'>,
  ): IPCInvokeReturn<'workflow:import'> {
    return this.workflow.importFromFile(workflowId);
  }

  @IPCInvoke('workflow:save')
  async updateWorklfow(
    @Payload()
    [workflowId, payload]: IPCInvokePayload<'workflow:save'>,
  ): IPCInvokeReturn<'workflow:save'> {
    await this.workflow.updateWorkflow(workflowId, payload);
  }
}
