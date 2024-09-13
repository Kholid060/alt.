import type { SetOptional } from 'type-fest';
import type { WORKFLOW_MANUAL_TRIGGER_ID } from '../utils/constant/workflow.const';
import type {
  WORKFLOW_NODE_TYPE,
  WorkflowEdges,
  WorkflowNodes,
} from '@altdot/workflow';

export type WorkflowNodeErroHandlerAction = 'continue' | 'stop' | 'fallback';

export type WorkflowGetNode<T extends WORKFLOW_NODE_TYPE> = Extract<
  WorkflowNodes,
  { type: T }
>;

export type WorkflowNewNode = SetOptional<WorkflowNodes, 'id'>;

export interface WorkflowClipboardData {
  edges: WorkflowEdges[];
  nodes: WorkflowNodes[];
}

export interface WorkflowEmitEvents {
  start: [detail: { workflowId: string; runnerId: string }];
  finish: [detail: { workflowId: string; runnerId: string }];
  error: [
    detail: { workflowId: string; runnerId: string; errorMessage: string },
  ];
  'node:execute-finish': [
    node: { id: string; type: WORKFLOW_NODE_TYPE },
    value: unknown,
  ];
  'node:execute-error': [
    node: { id: string; type: WORKFLOW_NODE_TYPE },
    message: string,
  ];
}

export interface WorkflowRunPayload {
  id: string;
  maxStep?: number;
  customElement?: WorkflowElement;
  startNodeId: typeof WORKFLOW_MANUAL_TRIGGER_ID | string;
  emitEvents?: Partial<Record<keyof WorkflowEmitEvents, boolean>>;
}

export interface WorkflowSettings {}

export interface WorkflowElement {
  edges: WorkflowEdges[];
  nodes: WorkflowNodes[];
}

export interface WorkflowVariable {
  id: string;
  name: string;
  value: string;
}
