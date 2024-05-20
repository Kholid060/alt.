import IPCRenderer from '#packages/common/utils/IPCRenderer';
import { WORKFLOW_NODE_TYPE } from '#packages/common/utils/constant/workflow.const';
import type { WorkflowRunnerExecuteOptions } from '../WorkflowRunnerManager';
import WorkflowRunnerManager from '../WorkflowRunnerManager';
import { WorkflowRunnerNodeError } from '../runner/workflow-runner-errors';
import type {
  WorkflowNodeHandlerExecute,
  WorkflowNodeHandlerExecuteReturn,
} from './WorkflowNodeHandler';
import WorkflowNodeHandler from './WorkflowNodeHandler';

function executeWorkflowPromise(options: WorkflowRunnerExecuteOptions) {
  return new Promise((resove, reject) => {
    WorkflowRunnerManager.instance
      .execute({
        ...options,
        onFinish(runner) {
          const lastNodeData = runner.dataStorage.nodeData.get('prevNode');
          resove(lastNodeData?.value ?? null);
        },
        onError(_runner, error) {
          reject(new Error(error.message));
        },
      })
      .catch(reject);
  });
}

export class NodeHandlerExecuteWorkflow extends WorkflowNodeHandler<WORKFLOW_NODE_TYPE.EXECUTE_WORKFLOW> {
  private controller = new AbortController();
  private timers = new Set<NodeJS.Timeout>();

  constructor() {
    super(WORKFLOW_NODE_TYPE.EXECUTE_WORKFLOW, {
      dataValidation: [
        { key: 'workflowId', name: 'Workflow id', types: ['String'] },
        { key: 'exposeVars', name: 'Expose variables', types: ['String'] },
      ],
    });
  }

  async execute({
    node,
    runner,
  }: WorkflowNodeHandlerExecute<WORKFLOW_NODE_TYPE.EXECUTE_WORKFLOW>): Promise<WorkflowNodeHandlerExecuteReturn> {
    if (runner.parentWorkflow?.id === node.data.workflowId) {
      throw new WorkflowRunnerNodeError(
        'This workflow is stopped to prevent circular workflow execution',
      );
    }

    const workflow = await IPCRenderer.invokeWithError(
      'database:get-workflow',
      node.data.workflowId,
    );
    if (!workflow) {
      throw new Error(
        `Couldn't find workflow with "${node.data.workflowId}" id`,
      );
    }

    const triggerNode = workflow.nodes.find(
      (node) => node.type === WORKFLOW_NODE_TYPE.TRIGGER_EXECUTE_WORKFLOW,
    );
    if (!triggerNode) {
      throw new Error(
        'The sub-workflow must include the "Trigger Execute Workflow" node to execute as a sub-workflow.',
      );
    }

    let exposedVars: Record<string, unknown> = {};
    if (node.data.exposeVars.includes('$$all')) {
      // Deep clone?
      exposedVars = runner.dataStorage.variables.getAll();
    } else {
      const varNames = node.data.exposeVars.split(',');
      const variables = runner.dataStorage.variables.getAll();

      varNames.forEach((varName) => {
        exposedVars[varName] = variables[varName];
      });
    }

    const result = await executeWorkflowPromise({
      workflow,
      startNodeId: triggerNode.id,
      parent: { id: runner.workflow.id, vars: exposedVars },
    });
    if (node.data.insertToVar) {
      runner.dataStorage.variables.set(node.data.varName, result);
    }

    return {
      value: result,
    };
  }

  destroy() {
    this.controller.abort();
    this.timers.forEach((value) => {
      clearTimeout(value);
    });

    this.timers.clear();
  }
}
