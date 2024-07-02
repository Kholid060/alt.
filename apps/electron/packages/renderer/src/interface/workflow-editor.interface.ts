import { WORKFLOW_NODE_GROUP, WorkflowNodesMap } from '@alt-dot/workflow';
import { UiListItem } from '@alt-dot/ui';
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

type WorkflowEditorNodeItemBase<T> = SetRequired<
  UiListItem<T> & { group: (typeof WORKFLOW_NODE_GROUP)[number] },
  'metadata'
>;

export type WorkflowEditorNodeListItemRecord = {
  [T in keyof WorkflowNodesMap]: WorkflowEditorNodeItemBase<
    {
      nodeType: WorkflowNodesMap[T]['type'];
    } & WorkflowNodesMap[T]['data']
  >;
};

export type WorkflowEditorNodeListItem<T extends keyof WorkflowNodesMap> =
  WorkflowEditorNodeItemBase<
    {
      nodeType: T;
    } & WorkflowNodesMap[T]['data']
  >;

export type WorkflowEditorNodeListItems =
  WorkflowEditorNodeListItemRecord[keyof WorkflowEditorNodeListItemRecord];

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
