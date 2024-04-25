import type {
  WORKFLOW_MANUAL_TRIGGER_ID,
  WORKFLOW_NODE_TYPE,
} from '../utils/constant/constant';
import type { Edge, Node } from 'reactflow';
import type { SetOptional } from 'type-fest';

interface WorkflowNodeBaseData {
  description?: string;
}

export type WorkflowNodeCommand = Node<
  {
    icon: string;
    title: string;
    commandId: string;
    extensionId: string;
    extensionTitle: string;
  } & WorkflowNodeBaseData,
  WORKFLOW_NODE_TYPE.COMMAND
>;

export interface WorkflowNodeTriggerManual {
  type: 'manual';
}

export type WorkflowNodeTrigger = Node<
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
