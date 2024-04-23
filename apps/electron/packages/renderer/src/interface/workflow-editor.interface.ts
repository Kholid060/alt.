import { WORKFLOW_NODE_TYPE } from '#packages/common/utils/constant/constant';
import { UiListItem } from '@repo/ui';
import { WorkflowNodeCommand, WorkflowNodeTrigger } from './workflow.interface';
import { SetRequired } from 'type-fest';

export enum WorkflowEditorContextMenuType {
  PANE,
  NODE,
  EDGE,
  SELECTION,
}

export interface XYPosition {
  x: number;
  y: number;
}

export type WorkflowEditorContextMenuEventPayload =
  | { type: WorkflowEditorContextMenuType.PANE; position: XYPosition }
  | {
      nodeId: string;
      position: XYPosition;
      type: WorkflowEditorContextMenuType.NODE;
    }
  | {
      edgeId: string;
      position: XYPosition;
      type: WorkflowEditorContextMenuType.EDGE;
    }
  | {
      nodeIds: string[];
      position: XYPosition;
      type: WorkflowEditorContextMenuType.SELECTION;
    };

export type WorkflowEditorNodeListCommandItem = SetRequired<
  UiListItem<
    { nodeType: WORKFLOW_NODE_TYPE.COMMAND } & WorkflowNodeCommand['data']
  >,
  'metadata'
>;

export type WorkflowEditorNodeListTriggerItem = SetRequired<
  UiListItem<
    { nodeType: WORKFLOW_NODE_TYPE.TRIGGER } & WorkflowNodeTrigger['data']
  >,
  'metadata'
>;

export type WorkflowEditorNodeListItem =
  | WorkflowEditorNodeListCommandItem
  | WorkflowEditorNodeListTriggerItem;

// hmm....
export interface WorkflowEditorOpenNodeListModalPayload {
  position: XYPosition;
  sourceEdge?: { nodeId: string; handleId: string };
}

export interface WorkflowEditorEvents {
  'context-menu:close': () => void;
  'context-menu:open': (payload: WorkflowEditorContextMenuEventPayload) => void;
  'node-list-modal:open': (
    payload: WorkflowEditorOpenNodeListModalPayload,
  ) => void;
}

export type WorkflowEditorOnEvent<T extends keyof WorkflowEditorEvents> = (
  ...args: Parameters<WorkflowEditorEvents[T]>
) => void;
