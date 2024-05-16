import type { Edge } from 'reactflow';
import type { SetOptional } from 'type-fest';
import type { WorkflowNodes } from './workflow-nodes.interface';
import type {
  WORKFLOW_NODE_TYPE,
  WORKFLOW_MANUAL_TRIGGER_ID,
} from '../utils/constant/workflow.const';

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

export interface WorkflowVariable {
  id: string;
  name: string;
  value: string;
}
