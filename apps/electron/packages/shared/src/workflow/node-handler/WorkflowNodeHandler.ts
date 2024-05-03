import type { WorkflowNodes } from '#packages/common/interface/workflow-nodes.interface';
import type { WORKFLOW_NODE_TYPE } from '#packages/common/utils/constant/constant';
import type WorkflowRunner from '../runner/WorkflowRunner';
import type { WorkflowRunnerPrevNodeExecution } from '../runner/WorkflowRunner';

export interface WorkflowNodeHandlerExecuteReturn {
  value: unknown;
  nextNodeId?: string;
  nextNodeHandle?: string;
}

export interface WorkflowNodeHandlerExecute<
  T extends WORKFLOW_NODE_TYPE = WORKFLOW_NODE_TYPE,
> {
  runner: WorkflowRunner;
  node: Extract<WorkflowNodes, { type: T }>;
  prevExecution?: WorkflowRunnerPrevNodeExecution;
}

abstract class WorkflowNodeHandler<
  T extends WORKFLOW_NODE_TYPE = WORKFLOW_NODE_TYPE,
> {
  type: T;

  constructor(type: T) {
    this.type = type;
  }

  abstract execute(
    params: WorkflowNodeHandlerExecute<T>,
  ):
    | WorkflowNodeHandlerExecuteReturn
    | Promise<WorkflowNodeHandlerExecuteReturn>;

  abstract destroy(): void;
}

export default WorkflowNodeHandler;
