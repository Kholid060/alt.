import {
  type Node,
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
} from 'reactflow';
import { create } from 'zustand';
import createStoreSelectors from '../utils/createStoreSelector';
import { nanoid } from 'nanoid/non-secure';
import { WorkflowNewNode } from '../interface/workflow.interface';

export interface WorkflowEditorStoreState {
  nodes: Node[];
  edges: Edge[];
}

export interface WorkflowEditorStoreActions {
  onConnect: OnConnect;
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  addNodes: (nodes: WorkflowNewNode[]) => void;
  addEdges: (connections: Connection[]) => void;
}

export type WorkflowEditorStore = WorkflowEditorStoreState &
  WorkflowEditorStoreActions;

const initialState: WorkflowEditorStoreState = {
  edges: [],
  nodes: [],
};

const workflowStore = create<WorkflowEditorStore>((set, get) => ({
  ...initialState,
  onNodesChange: (changes: NodeChange[]) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes),
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
  addNodes(nodes) {
    const newNodes: Node[] = nodes.map((node) => ({
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
  setNodes: (nodes: Node[]) => {
    set({ nodes });
  },
  setEdges: (edges: Edge[]) => {
    set({ edges });
  },
}));

export const useWorkflowStore = createStoreSelectors(workflowStore);
