import type { ExtensionCommandArgument } from '@repo/extension-core';
import type {
  WORKFLOW_MANUAL_TRIGGER_ID,
  WORKFLOW_NODE_TYPE,
} from '../utils/constant/constant';
import type { Edge, Node } from 'reactflow';
import type { SetOptional, SetRequired } from 'type-fest';

export type WorkflowNodeErroHandlerAction = 'continue' | 'stop' | 'fallback';

export interface WorkflowNodeErroHandler {
  retry: boolean;
  retryCount: number;
  retryIntervalMs: number;
  action: WorkflowNodeErroHandlerAction;
}

export interface WorkflowFormExpression {
  value: string;
  active: boolean;
}
export type WorkflowFormExpressionData = Record<string, WorkflowFormExpression>;

interface WorkflowNodeBaseData {
  isDisabled: boolean;
  description?: string;
  $expData: WorkflowFormExpressionData;
  $errorHandler?: WorkflowNodeErroHandler;
}

export type WorkflowNodeBase<
  T = unknown,
  P extends string = string,
> = SetRequired<Node<T & WorkflowNodeBaseData, P>, 'type'>;

export type WorkflowNodeCommand = WorkflowNodeBase<
  {
    icon: string;
    title: string;
    commandId: string;
    extension: {
      id: string;
      title: string;
      version: string;
    };
    args: ExtensionCommandArgument[];
    argsValue: Record<string, unknown>;
  },
  WORKFLOW_NODE_TYPE.COMMAND
>;

export interface WorkflowNodeTriggerManual {
  type: 'manual';
}

export type WorkflowNodeTrigger = WorkflowNodeBase<
  WorkflowNodeTriggerManual,
  WORKFLOW_NODE_TYPE.TRIGGER
>;

export type WorkflowNodes = WorkflowNodeCommand | WorkflowNodeTrigger;

export type WorkflowEdge = Edge;

export type WorkflowGetNode<T extends WORKFLOW_NODE_TYPE> = Extract<
  WorkflowNodeCommand,
  { type: T }
>;

export type WorkflowNewNode = SetOptional<WorkflowNodes, 'id'>;

export interface WorkflowClipboardData {
  edges: Edge[];
  nodes: WorkflowNodes[];
}

export interface WorkflowRunPayload {
  id: string;
  startNodeId: typeof WORKFLOW_MANUAL_TRIGGER_ID | string;
}

export interface WorkflowSettings {}
