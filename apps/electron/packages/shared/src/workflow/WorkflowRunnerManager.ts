import type { WorkflowRunnerRunPayload } from '#packages/common/interface/workflow-runner.interace';
import { nanoid } from 'nanoid';
import type { NodeHandlersObj } from './runner/WorkflowRunner';
import WorkflowRunner from './runner/WorkflowRunner';
import * as nodeHandlersClasses from './node-handler';
import { debugLog } from '#packages/common/utils/helper';
import type { DatabaseWorkflowHistoryUpdatePayload } from '#packages/main/src/interface/database.interface';
import { WORKFLOW_HISTORY_STATUS } from '#packages/common/utils/constant/workflow.const';
import IPCRenderer from '#packages/common/utils/IPCRenderer';
import type { SetRequired } from 'type-fest';

async function updateWorkflowHistory(
  historyId: number,
  {
    status,
    startedAt,
    errorMessage,
    errorLocation,
  }: SetRequired<DatabaseWorkflowHistoryUpdatePayload, 'startedAt'>,
) {
  const finishDate = new Date();
  const workflowHistory: DatabaseWorkflowHistoryUpdatePayload = {
    status,
    startedAt,
    errorMessage,
    errorLocation,
    endedAt: finishDate.toString(),
    duration: finishDate.getTime() - new Date(startedAt).getTime(),
  };

  await IPCRenderer.invoke(
    'database:update-workflow-history',
    historyId,
    workflowHistory,
  );
}

class WorkflowRunnerManager {
  private static _instance: WorkflowRunnerManager;

  static get instance() {
    return this._instance || (this._instance = new WorkflowRunnerManager());
  }

  private runners: Map<string, WorkflowRunner> = new Map();

  constructor() {}

  async execute({ startNodeId, workflow }: WorkflowRunnerRunPayload) {
    const runnerId = nanoid(5);

    const historyId = await IPCRenderer.invokeWithError(
      'database:insert-workflow-history',
      {
        workflowId: workflow.id,
        startedAt: new Date().toString(),
        status: WORKFLOW_HISTORY_STATUS.Running,
      },
    );

    const nodeHandlers = Object.values(nodeHandlersClasses).reduce<
      Record<string, unknown>
    >((acc, HandlerClass) => {
      const nodeHandler = new HandlerClass();
      acc[nodeHandler.type] = nodeHandler;

      return acc;
    }, {}) as NodeHandlersObj;

    const runner = new WorkflowRunner({
      workflow,
      startNodeId,
      nodeHandlers,
      id: runnerId,
    });
    runner.once('error', ({ message, location }) => {
      debugLog(`Error on "${workflow.name}" workflow: ${message}`);

      updateWorkflowHistory(historyId, {
        errorMessage: message,
        errorLocation: location,
        startedAt: runner.startedAt,
        status: WORKFLOW_HISTORY_STATUS.Error,
      });

      runner.destroy();
      this.runners.delete(runnerId);
    });
    runner.once('finish', (reason) => {
      debugLog(`Finish "${workflow.name}" execution: ${reason}`);

      updateWorkflowHistory(historyId, {
        startedAt: runner.startedAt,
        status: WORKFLOW_HISTORY_STATUS.Finish,
      });

      runner.destroy();
      this.runners.delete(runnerId);
    });

    runner.start();

    this.runners.set(runnerId, runner);

    return runnerId;
  }

  stop(runnerId: string) {
    if (!this.runners.has(runnerId)) return;

    this.runners.get(runnerId)?.stop();
    this.runners.delete(runnerId);
  }
}

export default WorkflowRunnerManager;
