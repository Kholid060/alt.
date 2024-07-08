import {
  type Edge,
  addEdge,
  Connection,
  updateEdge,
  NodeChange,
  EdgeChange,
  applyEdgeChanges,
  applyNodeChanges,
  Node,
} from 'reactflow';
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import createStoreSelectors from '../../utils/createStoreSelector';
import { nanoid } from 'nanoid/non-secure';
import {
  WorkflowEdge,
  WorkflowElement,
  WorkflowNewNode,
} from '#common/interface/workflow.interface';
import { WORKFLOW_NODE_TRIGGERS } from '#packages/common/utils/constant/workflow.const';
import { createDebounce } from '@altdot/shared';
import { WORKFLOW_NODE_TYPE, WorkflowNodes } from '@altdot/workflow';
import {
  UndoRedoStoreSlice,
  createUndoRedoStoreSlice,
} from './undo-redo.store-slice';
import {
  WorkflowDetailModel,
  WorkflowUpdatePayload,
} from '#packages/main/src/workflow/workflow.interface';

export interface WorkflowEditorStoreState {
  isEditNodeDirty: boolean;
  isTriggerChanged: boolean;
  selection: WorkflowElement;
  enableWorkflowSaveBtn: boolean;
  editNode: WorkflowNodes | null;
  workflow: WorkflowDetailModel | null;
  workflowChanges: Set<keyof WorkflowUpdatePayload>;
}

export interface WorkflowEditorStoreActions {
  $reset: () => void;
  clearWorkflowChanges: () => void;
  addNodes: (nodes: WorkflowNewNode[]) => void;
  addEdges: (connections: Connection[]) => void;
  setEditNode(node: WorkflowNodes | null): void;
  setSelection(selection: WorkflowElement): void;
  toggleSaveWorkflowBtn: (enable: boolean) => void;
  setWorkflow: (workflow: WorkflowDetailModel) => void;
  deleteEdgeBy: (by: 'id' | 'source' | 'sourceHandle', ids: string[]) => void;
  updateEditNode<T extends WorkflowNodes = WorkflowNodes>(
    node: Partial<T['data']>,
  ): void;
  updateWorkflow: (
    data:
      | WorkflowUpdatePayload
      | ((workflow: WorkflowDetailModel) => WorkflowUpdatePayload),
    saveChanges?: boolean,
  ) => void;
  updateEdge: (edgeId: string | Edge, connection: Connection) => boolean;
  updateNodeData: (
    nodeId: string,
    data: Partial<WorkflowNodes['data']>,
  ) => boolean;
  applyElementChanges(changes: {
    nodes?: NodeChange[];
    edges?: EdgeChange[];
  }): void;
}

export type WorkflowEditorStore = WorkflowEditorStoreState &
  WorkflowEditorStoreActions &
  UndoRedoStoreSlice;

const initialState: WorkflowEditorStoreState = {
  workflow: null,
  editNode: null,
  isEditNodeDirty: false,
  isTriggerChanged: false,
  workflowChanges: new Set(),
  enableWorkflowSaveBtn: false,
  selection: { edges: [], nodes: [] },
};

const updateWorkflowNodeDebounce = createDebounce();

const workflowEditorStore = create(
  subscribeWithSelector<WorkflowEditorStore>((set, get, ...rest) => ({
    ...initialState,
    ...createUndoRedoStoreSlice(set, get, ...rest),
    clearWorkflowChanges() {
      set({
        workflowChanges: new Set(),
      });
    },
    toggleSaveWorkflowBtn(enable) {
      set({ enableWorkflowSaveBtn: enable });
    },
    updateNodeData(nodeId, data) {
      let nodeFound = false;

      get().updateWorkflow(({ nodes }) => {
        const newNodes = nodes.map((node) => {
          if (node.id !== nodeId) return node;

          nodeFound = true;

          return { ...node, data: { ...node.data, ...data } };
        }) as WorkflowNodes[];

        if (!nodeFound) return {};

        return { nodes: newNodes };
      });

      return nodeFound;
    },
    setEditNode(node) {
      if (get().editNode?.id === node?.id) return;

      set({ editNode: structuredClone(node), isEditNodeDirty: false });
    },
    setSelection(selection) {
      set({ selection });
    },
    updateEditNode(nodeData) {
      const { editNode: currentNode, isTriggerChanged } = get();
      if (!currentNode) return;

      const node = {
        ...currentNode,
        data: { ...currentNode.data, ...nodeData },
      } as WorkflowNodes;

      set({
        editNode: node,
        isEditNodeDirty: true,
        isTriggerChanged:
          isTriggerChanged ||
          WORKFLOW_NODE_TRIGGERS.includes(node.data.$nodeType),
      });

      updateWorkflowNodeDebounce(() => {
        get().updateWorkflow(({ nodes }) => {
          let nodeUpdated = false;

          const newNodes = nodes.map((item) => {
            if (node.id !== item.id) return item;

            nodeUpdated = true;

            return {
              ...item,
              data: {
                ...item.data,
                ...node.data,
              },
            };
          }) as WorkflowNodes[];

          if (!nodeUpdated) return {};

          return { nodes: newNodes };
        });
      }, 250);
    },
    applyElementChanges({ edges, nodes }) {
      const { workflow, enableWorkflowSaveBtn: enableWorkflowSaveBtnState } =
        get();
      if (!workflow) return;

      let enableWorkflowSaveBtn = true;
      const updatedElement: Partial<WorkflowElement> = {};

      if (edges) updatedElement.edges = applyEdgeChanges(edges, workflow.edges);
      if (nodes) {
        enableWorkflowSaveBtn =
          enableWorkflowSaveBtnState ||
          (nodes.length > 1 && nodes[0].type === 'select');
        updatedElement.nodes = applyNodeChanges(
          nodes,
          workflow.nodes as Node[],
        ) as WorkflowNodes[];
      }

      set({
        enableWorkflowSaveBtn,
        workflow: { ...workflow, ...updatedElement },
      });
    },
    updateWorkflow(data, saveChanges = true) {
      const state = get();
      const currentWorkflow = state.workflow;
      if (!currentWorkflow) throw new Error("Workflow hasn't been initialized");

      const newData = typeof data === 'function' ? data(currentWorkflow) : data;
      const keys = Object.keys(newData) as (keyof WorkflowUpdatePayload)[];

      if (keys.length === 0) return;

      const updatePayload: Partial<WorkflowEditorStoreState> = {
        workflowChanges: new Set([...state.workflowChanges, ...keys]),
        workflow: {
          ...currentWorkflow,
          ...newData,
        },
      };
      if (saveChanges) {
        updatePayload.enableWorkflowSaveBtn = true;
      }

      set(updatePayload);
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
      if (nodes.length <= 0) return;

      const {
        updateWorkflow,
        addCommands,
        isTriggerChanged: isTriggerChangedVal,
      } = get();
      let isTriggerChanged = isTriggerChangedVal;

      updateWorkflow((workflow) => {
        const oldNodes = workflow.nodes;

        const noDuplicateNodes: Partial<Record<WORKFLOW_NODE_TYPE, boolean>> = {
          [WORKFLOW_NODE_TYPE.TRIGGER]: false,
          [WORKFLOW_NODE_TYPE.TRIGGER_EXECUTE_WORKFLOW]: false,
        };

        const newNodes = nodes.reduce<WorkflowNodes[]>((acc, node) => {
          if (!isTriggerChanged && WORKFLOW_NODE_TRIGGERS.includes(node.type)) {
            isTriggerChanged = true;
          }

          if (
            Object.hasOwn(noDuplicateNodes, node.type) &&
            !noDuplicateNodes[node.type]
          ) {
            noDuplicateNodes[node.type] = oldNodes.some(
              (oldNode) => oldNode.type === node.type,
            );
            if (noDuplicateNodes[node.type]) return acc;
          }

          acc.push({
            ...node,
            id: node.id || nanoid(),
          });

          return acc;
        }, []);

        if (newNodes.length === 0) return {};

        addCommands([{ type: 'node-added', nodes: newNodes }]);

        return {
          nodes: [...oldNodes, ...newNodes],
        };
      });

      if (isTriggerChanged) set({ isTriggerChanged });
    },
    addEdges(connections) {
      if (connections.length <= 0) return;

      get().updateWorkflow((workflow) => {
        const newEdgeIds: string[] = [];
        const newEdges = connections.reduce<Edge[]>((acc, connection) => {
          const edgeId = nanoid(6);
          newEdgeIds.push(edgeId);

          return addEdge({ ...connection, id: edgeId }, acc);
        }, workflow.edges ?? []);

        const addedEdges = newEdgeIds.reduce<WorkflowEdge[]>((acc, edgeId) => {
          const edge = newEdges.find((edge) => edge.id === edgeId);
          if (edge) acc.push(edge as WorkflowEdge);

          return acc;
        }, []);
        if (addedEdges.length > 0) {
          get().addCommands([{ type: 'edge-added', edges: addedEdges }]);
        }

        return {
          edges: newEdges,
        };
      });
    },
    deleteEdgeBy(by, ids) {
      get().updateWorkflow((workflow) => {
        const deletedEdges: WorkflowEdge[] = [];

        const edgeIds = new Set(ids);
        const newEdges = workflow.edges.filter((edge) => {
          if (!edgeIds.has(edge[by] ?? '')) return true;

          deletedEdges.push(edge);

          return false;
        });

        get().addCommands([{ type: 'edge-removed', edges: deletedEdges }]);

        return {
          edges: newEdges,
        };
      });
    },
    setWorkflow(workflow) {
      set({ workflow });
    },
    $reset() {
      get().$resetUndoRedo();
      set(initialState);
    },
  })),
);

export const useWorkflowEditorStore = createStoreSelectors(workflowEditorStore);
