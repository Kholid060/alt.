/* eslint-disable drizzle/enforce-delete-with-where */
import type { WorkflowRunnerRunPayload } from '#packages/common/interface/workflow-runner.interace';
import { nanoid } from 'nanoid';
import {
  NodeHandlersObj,
  WorkflowRunnerFinishReason,
  WorkflowRunnerParent,
} from './runner/WorkflowRunner';
import WorkflowRunner from './runner/WorkflowRunner';
import * as nodeHandlersClasses from './node-handler';
import { WorkflowRunnerMessagePort } from '../interfaces/workflow-runner.interface';
import { debugLog } from '#packages/common/utils/helper';
import {
  WORKFLOW_NODE_TYPE,
  WORKFLOW_NODES,
  WorkflowNodes,
} from '@altdot/workflow';

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

function getWorkflowName(node: WorkflowNodes) {
  if (node.type === WORKFLOW_NODE_TYPE.COMMAND) {
    return node.data.title;
  }

  return WORKFLOW_NODES[node.type].title;
}

class WorkflowRunnerManager {
  static readonly instance = new WorkflowRunnerManager();

  private runners: Map<string, WorkflowRunner> = new Map();
  private messagePort: WorkflowRunnerMessagePort | null = null;

  setMessagePort(port: WorkflowRunnerMessagePort) {
    this.messagePort = port;
  }

  async execute({
    logDir,
    parent,
    onError,
    workflow,
    onFinish,
    startNodeId,
    ...rest
  }: WorkflowRunnerExecuteOptions) {
    if (!this.messagePort) throw new Error('Missing message port');

    const runnerId = rest.runnerId ?? nanoid(5);
    const nodeHandlers = Object.values(nodeHandlersClasses).reduce<
      Record<string, unknown>
    >((acc, HandlerClass) => {
      const nodeHandler = new HandlerClass();
      acc[nodeHandler.type] = nodeHandler;

      return acc;
    }, {}) as NodeHandlersObj;

    debugLog('Executing workflow:', workflow.name, runnerId);

    const runner = new WorkflowRunner({
      ...rest,
      logDir,
      workflow,
      startNodeId,
      nodeHandlers,
      id: runnerId,
      parentWorkflow: parent,
      messagePort: this.messagePort,
    });
    runner.once('error', async ({ message, node }) => {
      runner.logger.instance.error(
        { node: node && { id: node.id, type: node.type } },
        `Stop executing because of error: ${message}`,
      );
      const location = node ? `${node.type}:${node.id}` : undefined;

      this.messagePort!.sync.sendMessage('workflow-event:error', runnerId, {
        node,
        message,
        errorLocation: location,
        startedAt: runner.startedAt,
      });

      if (onError) await onError(runner, { message, location });
    });
    runner.once('finish', async (reason) => {
      runner.logger.instance.info(`Finish execution, reason: ${reason}`);

      this.messagePort!.sync.sendMessage('workflow-event:finish', runnerId, {
        reason,
        startedAt: runner.startedAt,
      });

      debugLog('Finish workflow execution:', workflow.name, runnerId);

      if (onFinish) await onFinish(runner, reason);
    });
    runner.on('node:execute-finish', (node, execResult) => {
      this.messagePort!.sync.sendMessage(
        'workflow-event:node-execute-finish',
        runnerId,
        {
          id: node.id,
          type: node.type,
          name: getWorkflowName(node),
        },
        execResult,
      );
    });
    runner.on('node:execute-error', (node, message) => {
      this.messagePort!.sync.sendMessage(
        'workflow-event:node-execute-error',
        runnerId,
        {
          id: node.id,
          type: node.type,
          name: getWorkflowName(node),
        },
        message,
      );
    });

    runner.start();
    this.runners.set(runnerId, runner);

    return runner;
  }

  stop(runnerId: string) {
    this.runners.get(runnerId)!.stop();
    this.runners.delete(runnerId);
  }
}

export default WorkflowRunnerManager;
