import type { WorkflowNodes } from '#packages/common/interface/workflow.interface';
import type { WORKFLOW_NODE_TYPE } from '#packages/common/utils/constant/constant';
import type WorkflowRunner from '../WorkflowRunner';

export interface WorkflowNodeHandlerReturn {
  value: unknown;
  nextNodeId?: string;
}

export type WorkflowNodeHandler<
  T extends WORKFLOW_NODE_TYPE = WORKFLOW_NODE_TYPE,
> = {
  type: T;
  (
    this: WorkflowRunner,
    node: Extract<WorkflowNodes, { type: T }>,
  ): WorkflowNodeHandlerReturn | Promise<WorkflowNodeHandlerReturn>;
};
