import {
  WORKFLOW_NODE_TYPE,
  WorkflowNodes,
  WorkflowNodesMap,
} from '@altdot/workflow';
import type WorkflowRunner from '../runner/WorkflowRunner';
import type { WorkflowRunnerPrevNodeExecution } from '../runner/WorkflowRunner';
import { PossibleTypes } from '../../interfaces/workflow-runner-worker.interface';

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type NodeDataValidationSchema<T extends Record<string, any>> = {
  key: keyof T;
  name: string;
  optional?: boolean;
  types: PossibleTypes[];
}[];

abstract class WorkflowNodeHandler<
  T extends WORKFLOW_NODE_TYPE = WORKFLOW_NODE_TYPE,
> {
  type: T;
  dataValidation?: NodeDataValidationSchema<WorkflowNodesMap[T]['data']>;

  constructor(
    type: T,
    options?: {
      dataValidation?: NodeDataValidationSchema<WorkflowNodesMap[T]['data']>;
    },
  ) {
    this.type = type;
    this.dataValidation = options?.dataValidation;
  }

  abstract execute(
    params: WorkflowNodeHandlerExecute<T>,
  ):
    | WorkflowNodeHandlerExecuteReturn
    | Promise<WorkflowNodeHandlerExecuteReturn>;

  abstract destroy(): void;
}

export class NodeHandlerNoOp<
  T extends WORKFLOW_NODE_TYPE,
> extends WorkflowNodeHandler<T> {
  constructor(type: T) {
    super(type);
  }

  execute(): WorkflowNodeHandlerExecuteReturn {
    // do nothing
    return { value: null };
  }

  destroy(): void {
    // do nothing
  }
}

export default WorkflowNodeHandler;
