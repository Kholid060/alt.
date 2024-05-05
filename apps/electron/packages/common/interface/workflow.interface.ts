import type {
  WORKFLOW_MANUAL_TRIGGER_ID,
  WORKFLOW_NODE_TYPE,
} from '../utils/constant/constant';
import type { Edge } from 'reactflow';
import type { SetOptional } from 'type-fest';
import type { WorkflowNodes } from './workflow-nodes.interface';

export type WorkflowNodeErroHandlerAction = 'continue' | 'stop' | 'fallback';

export type WorkflowEdge = Edge;

export type WorkflowGetNode<T extends WORKFLOW_NODE_TYPE> = Extract<
  WorkflowNodes,
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

export interface WorkflowElement {
  edges: WorkflowEdge[];
  nodes: WorkflowNodes[];
}
