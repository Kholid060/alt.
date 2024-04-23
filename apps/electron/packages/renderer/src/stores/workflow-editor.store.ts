import {
  type Edge,
  type OnConnect,
  type OnEdgesChange,
  type OnNodesChange,
  Connection,
  EdgeChange,
  NodeChange,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  updateEdge,
  OnSelectionChangeFunc,
} from 'reactflow';
import { create } from 'zustand';
import createStoreSelectors from '../utils/createStoreSelector';
import { nanoid } from 'nanoid/non-secure';
import {
  WorkflowClipboardData,
  WorkflowNewNode,
  WorkflowNodes,
} from '../interface/workflow.interface';
import { APP_WORKFLOW_ELS_FORMAT } from '#packages/common/utils/constant/constant';
import preloadAPI from '../utils/preloadAPI';
import { parseJSON } from '@repo/shared';
import { isIPCEventError } from '../utils/helper';

export interface WorkflowEditorStoreState {
  nodes: WorkflowNodes[];
  edges: Edge[];
  selection: { nodes: WorkflowNodes[]; edges: Edge[] };
}

export interface WorkflowEditorStoreActions {
  onConnect: OnConnect;
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onSelectionChange: OnSelectionChangeFunc;
  setEdges: (edges: Edge[]) => void;
  setNodes: (nodes: WorkflowNodes[]) => void;
  addNodes: (nodes: WorkflowNewNode[]) => void;
  addEdges: (connections: Connection[]) => void;
  deleteEdge: (edgeId: string | string[]) => void;
  pasteElements: () => Promise<WorkflowClipboardData | null>;
  copyElements: (element?: { nodeId?: string; edgeId?: string }) => void;
  updateEdge: (edgeId: string | Edge, connection: Connection) => boolean;
}

export type WorkflowEditorStore = WorkflowEditorStoreState &
  WorkflowEditorStoreActions;

const initialState: WorkflowEditorStoreState = {
  edges: [],
  nodes: [],
  selection: { edges: [], nodes: [] },
};

const workflowStore = create<WorkflowEditorStore>((set, get) => ({
  ...initialState,
  async pasteElements() {
    const copiedElements = await preloadAPI.main.invokeIpcMessage(
      'clipboard:read-buffer',
      APP_WORKFLOW_ELS_FORMAT,
    );
    if (isIPCEventError(copiedElements)) return null;

    const elements: WorkflowClipboardData | null = parseJSON(
      copiedElements,
      null,
    );
    if (
      !elements ||
      !Array.isArray(elements.nodes) ||
      !Array.isArray(elements.edges)
    )
      return null;

    const newNodeIdsMap: Record<string, string> = {};

    const nodes: WorkflowNewNode[] = elements.nodes.map(
      ({ data, position, type, id }) => {
        const nodeId = nanoid();
        newNodeIdsMap[id] = nodeId;

        return { id: nodeId, type, data, position };
      },
    );
    const edges: Connection[] = elements.edges.map(
      ({ source, sourceHandle, target, targetHandle }) => ({
        source: newNodeIdsMap[source] || source,
        target: newNodeIdsMap[target] || target,
        sourceHandle: sourceHandle || '',
        targetHandle: targetHandle || '',
      }),
    );

    if (nodes.length > 0) get().addNodes(nodes);
    if (edges.length > 0) get().addEdges(edges);

    return null;
  },
  copyElements(element) {
    const state = get();

    const { edges, nodes } = state.selection;
    let workflowClipboardData: WorkflowClipboardData | null = null;

    if (edges.length > 0 || nodes.length > 0) {
      workflowClipboardData = { edges, nodes };
    } else if (element?.nodeId) {
      const node = state.nodes.find((item) => item.id === element.nodeId);
      if (!node) return;

      workflowClipboardData = { edges: [], nodes: [node] };
    } else if (element?.edgeId) {
      const edge = state.edges.find((item) => item.id === element.edgeId);
      if (!edge) return;

      workflowClipboardData = { edges: [edge], nodes: [] };
    }

    if (!workflowClipboardData) return;

    preloadAPI.main.invokeIpcMessage(
      'clipboard:copy-buffer',
      APP_WORKFLOW_ELS_FORMAT,
      JSON.stringify(workflowClipboardData),
    );
  },
  onNodesChange: (changes: NodeChange[]) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes) as WorkflowNodes[],
    });
  },
  onEdgesChange: (changes: EdgeChange[]) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
    });
  },
  onConnect: (connection: Connection) => {
    set({
      edges: addEdge(connection, get().edges),
    });
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
    const state = get();

    const oldEdge =
      typeof edgeId === 'string'
        ? state.edges.find((edge) => edge.id === edgeId)
        : edgeId;
    if (!oldEdge) return false;

    set({ edges: updateEdge(oldEdge, connection, state.edges) });

    return true;
  },
  addNodes(nodes) {
    const newNodes: WorkflowNodes[] = nodes.map((node) => ({
      ...node,
      id: node.id || nanoid(),
    }));

    set({
      nodes: [...get().nodes, ...newNodes],
    });
  },
  addEdges(connections) {
    const state = get();
    const newEdges = connections.flatMap((connection) =>
      addEdge(connection, state.edges),
    );

    set({
      edges: newEdges,
    });
  },
  deleteEdge(edgeId) {
    const edgeIds = new Set(Array.isArray(edgeId) ? edgeId : [edgeId]);
    set({
      edges: get().edges.filter((edge) => !edgeIds.has(edge.id)),
    });
  },
  setNodes: (nodes) => {
    set({ nodes });
  },
  setEdges: (edges) => {
    set({ edges });
  },
}));

export const useWorkflowStore = createStoreSelectors(workflowStore);
