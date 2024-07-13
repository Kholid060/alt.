/* eslint-disable drizzle/enforce-delete-with-where */
import type { WorkflowRunnerRunPayload } from '#packages/common/interface/workflow-runner.interace';
import { nanoid } from 'nanoid';
import type {
  NodeHandlersObj,
  WorkflowRunnerFinishReason,
  WorkflowRunnerParent,
} from './runner/WorkflowRunner';
import WorkflowRunner from './runner/WorkflowRunner';
import * as nodeHandlersClasses from './node-handler';
import { WORKFLOW_HISTORY_STATUS } from '#packages/common/utils/constant/workflow.const';
import IPCRenderer from '#packages/common/utils/IPCRenderer';
import type { SetRequired } from 'type-fest';
import IdleTimer from '#packages/common/utils/IdleTimer';
import { WorkflowHistoryUpdatePayload } from '#packages/main/src/workflow/workflow-history/workflow-history.interface';

const IDLE_TIMER_KEY = 'workflow-manager';

async function updateWorkflowHistory(
  historyId: number | { runnerId: string },
  {
    status,
    startedAt,
    errorMessage,
    errorLocation,
  }: SetRequired<WorkflowHistoryUpdatePayload, 'startedAt'>,
) {
  const finishDate = new Date();
  const workflowHistory: WorkflowHistoryUpdatePayload = {
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

export interface WorkflowRunnerExecuteOptions extends WorkflowRunnerRunPayload {
  onFinish?(
    runner: WorkflowRunner,
    reason: WorkflowRunnerFinishReason,
  ): void | Promise<void>;
  onError?(
    runner: WorkflowRunner,
    error: { message: string; location?: string },
  ): void | Promise<void>;
  parent?: WorkflowRunnerParent;
}

class WorkflowRunnerManager {
  private static _instance: WorkflowRunnerManager;

  static get instance() {
    return this._instance || (this._instance = new WorkflowRunnerManager());
  }

  private runners: Map<string, WorkflowRunner> = new Map();

  constructor() {}

  async execute({
    logDir,
    parent,
    onError,
    workflow,
    onFinish,
    startNodeId,
    ...rest
  }: WorkflowRunnerExecuteOptions) {
    const runnerId = nanoid(5);
    const historyId = await IPCRenderer.invokeWithError(
      'database:insert-workflow-history',
      {
        runnerId,
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
      ...rest,
      logDir,
      workflow,
      startNodeId,
      nodeHandlers,
      id: runnerId,
      parentWorkflow: parent,
    });
    runner.once('error', async ({ message, node }) => {
      try {
        runner.logger.instance.error(
          { node: node && { id: node.id, type: node.type } },
          `Stop executing because of error: ${message}`,
        );
        const location = node ? `${node.type}:${node.id}` : undefined;

        IPCRenderer.send('workflow:running-change', 'finish', {
          runnerId,
          workflowId: workflow.id,
        });

        await updateWorkflowHistory(historyId, {
          errorMessage: message,
          errorLocation: location,
          startedAt: runner.startedAt,
          status: WORKFLOW_HISTORY_STATUS.Error,
        });

        if (onError) await onError(runner, { message, location });
      } catch (error) {
        console.error(error);
      } finally {
        runner.destroy();
        this.runners.delete(runnerId);
      }
    });
    runner.once('finish', async (reason) => {
      try {
        runner.logger.instance.info(`Finish execution, reason: ${reason}`);

        IPCRenderer.send('workflow:running-change', 'finish', {
          runnerId,
          workflowId: workflow.id,
        });

        await updateWorkflowHistory(historyId, {
          startedAt: runner.startedAt,
          status: WORKFLOW_HISTORY_STATUS.Finish,
        });

        if (onFinish) await onFinish(runner, reason);
      } catch (error) {
        console.error(error);
      } finally {
        runner.destroy();
        this.runners.delete(runnerId);
      }
    });
    runner.on('node:execute-finish', ({ id, type }, execResult) => {
      IPCRenderer.send('shared-process:workflow-events', {
        'node:execute-finish': [{ id, type }, execResult.value],
      });
    });
    runner.on('node:execute-error', ({ id, type }, message) => {
      IPCRenderer.send('shared-process:workflow-events', {
        'node:execute-error': [{ id, type }, message],
      });
    });

    IdleTimer.instance.lock(IDLE_TIMER_KEY);
    IPCRenderer.send('workflow:running-change', 'running', {
      runnerId,
      workflowId: workflow.id,
    });

    runner.start();
    this.runners.set(runnerId, runner);

    return runner;
  }

  stop(runnerId: string) {
    if (!this.runners.has(runnerId)) {
      IPCRenderer.invokeWithError('database:get-workflow-history', {
        runnerId,
      }).then((value) => {
        if (!value) return;

        updateWorkflowHistory(
          { runnerId },
          {
            startedAt: value.startedAt,
            status: WORKFLOW_HISTORY_STATUS.Finish,
          },
        );
      });
      return;
    }

    this.runners.get(runnerId)!.stop();
    this.runners.delete(runnerId);

    if (this.runners.size === 0) {
      IdleTimer.instance.unlock(IDLE_TIMER_KEY);
    }
  }
}

export default WorkflowRunnerManager;
