import {
  type Edge,
  type OnConnect,
  type OnEdgesChange,
  type OnNodesChange,
  Node,
  addEdge,
  Connection,
  updateEdge,
  applyEdgeChanges,
  applyNodeChanges,
  OnSelectionChangeFunc,
} from 'reactflow';
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import createStoreSelectors from '../utils/createStoreSelector';
import { nanoid } from 'nanoid/non-secure';
import {
  WorkflowNewNode,
  WorkflowNodes,
} from '#common/interface/workflow.interface';
import { WORKFLOW_NODE_TYPE } from '#packages/common/utils/constant/constant';
import {
  DatabaseWorkflowDetail,
  DatabaseWorkflowUpdatePayload,
} from '#packages/main/src/interface/database.interface';

export interface WorkflowEditorStoreState {
  workflowLastSavedAt: null | string;
  workflow: DatabaseWorkflowDetail | null;
  selection: { nodes: WorkflowNodes[]; edges: Edge[] };
  workflowChanges: Set<keyof DatabaseWorkflowUpdatePayload>;
}

export interface WorkflowEditorStoreActions {
  $reset: () => void;
  onConnect: OnConnect;
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  clearWorkflowChanges: () => void;
  onSelectionChange: OnSelectionChangeFunc;
  addNodes: (nodes: WorkflowNewNode[]) => void;
  addEdges: (connections: Connection[]) => void;
  deleteEdge: (edgeId: string | string[]) => void;
  setWorkflow: (workflow: DatabaseWorkflowDetail) => void;
  updateWorkflow: (
    data:
      | DatabaseWorkflowUpdatePayload
      | ((workflow: DatabaseWorkflowDetail) => DatabaseWorkflowUpdatePayload),
  ) => void;
  updateEdge: (edgeId: string | Edge, connection: Connection) => boolean;
}

export type WorkflowEditorStore = WorkflowEditorStoreState &
  WorkflowEditorStoreActions;

const initialState: WorkflowEditorStoreState = {
  workflow: null,
  workflowLastSavedAt: null,
  workflowChanges: new Set(),
  selection: { edges: [], nodes: [] },
};

const workflowEditorStore = create(
  subscribeWithSelector<WorkflowEditorStore>((set, get) => ({
    ...initialState,
    clearWorkflowChanges() {
      set({ workflowChanges: new Set() });
    },
    updateWorkflow(data) {
      const state = get();
      const currentWorkflow = state.workflow;
      if (!currentWorkflow) throw new Error("Workflow hasn't been initialized");

      const newData = typeof data === 'function' ? data(currentWorkflow) : data;
      const keys = Object.keys(
        newData,
      ) as (keyof DatabaseWorkflowUpdatePayload)[];

      if (keys.length === 0) return;

      set({
        workflowLastSavedAt: new Date().toString(),
        workflowChanges: new Set([...state.workflowChanges, ...keys]),
        workflow: {
          ...currentWorkflow,
          ...newData,
        },
      });
    },
    onNodesChange(changes) {
      get().updateWorkflow((workflow) => ({
        nodes: applyNodeChanges(
          changes,
          workflow.nodes as Node[],
        ) as WorkflowNodes[],
      }));
    },
    onEdgesChange(changes) {
      get().updateWorkflow((workflow) => ({
        edges: applyEdgeChanges(changes, workflow.edges),
      }));
    },
    onConnect(connection: Connection) {
      get().updateWorkflow((workflow) => ({
        edges: addEdge(connection, workflow.edges),
      }));
    },
    onSelectionChange({ edges, nodes }) {
      set({
        selection: {
          edges,
          nodes: nodes as WorkflowNodes[],
        },
      });
    },
    updateEdge(edgeId, connection) {
      get().updateWorkflow((workflow) => {
        const oldEdge =
          typeof edgeId === 'string'
            ? workflow.edges.find((edge) => edge.id === edgeId)
            : edgeId;
        if (!oldEdge) return {};

        return {
          edges: updateEdge(oldEdge, connection, workflow.edges),
        };
      });

      return true;
    },
    addNodes(nodes) {
      get().updateWorkflow((workflow) => {
        const oldNodes = workflow.nodes;
        let isHasManualTrigger = false;

        const newNodes = nodes.reduce<WorkflowNodes[]>((acc, node) => {
          if (
            node.type === WORKFLOW_NODE_TYPE.TRIGGER &&
            node.data.type === 'manual' &&
            !isHasManualTrigger
          ) {
            isHasManualTrigger = oldNodes.some(
              (oldNode) =>
                oldNode.type === WORKFLOW_NODE_TYPE.TRIGGER &&
                oldNode.data.type === 'manual',
            );
            if (isHasManualTrigger) return acc;
          }

          acc.push({
            ...node,
            id: node.id || nanoid(),
          });

          return acc;
        }, []);

        if (newNodes.length === 0) return {};

        return {
          nodes: [...oldNodes, ...newNodes],
        };
      });
    },
    addEdges(connections) {
      get().updateWorkflow((workflow) => {
        const newEdges = connections.flatMap((connection) =>
          addEdge(connection, workflow.edges ?? []),
        );

        return {
          edges: newEdges,
        };
      });
    },
    deleteEdge(edgeId) {
      get().updateWorkflow((workflow) => {
        const edgeIds = new Set(Array.isArray(edgeId) ? edgeId : [edgeId]);

        return {
          edges: workflow.edges.filter((edge) => !edgeIds.has(edge.id)),
        };
      });
    },
    setWorkflow(workflow) {
      set({ workflow });
    },
    $reset() {
      set(initialState);
    },
  })),
);

export const useWorkflowEditorStore = createStoreSelectors(workflowEditorStore);
