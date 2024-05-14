import { StateCreator } from 'zustand';
import { WorkflowEditorStore } from './workflow-editor.store';
import { XYPosition } from 'reactflow';
import { WorkflowNodes } from '#packages/common/interface/workflow-nodes.interface';
import { WorkflowEdge } from '#packages/common/interface/workflow.interface';

export interface UndoRedoNodeMoveCommand {
  type: 'node-move';
  positions: Map<string, XYPosition>;
  oldPositions: Map<string, XYPosition>;
}

export interface UndoRedoNodeAddedRemovedCommand {
  nodes: WorkflowNodes[];
  type: 'node-added' | 'node-removed';
}

export interface UndoRedoEdgeAddedCommand {
  edges: WorkflowEdge[];
  type: 'edge-added' | 'edge-removed';
}

export type UndoRedoCommands =
  | UndoRedoNodeMoveCommand
  | UndoRedoEdgeAddedCommand
  | UndoRedoNodeAddedRemovedCommand;

interface UndoRedoSliceState {
  historyIndex: number;
  history: UndoRedoCommands[];
}

interface UndoRedoSliceActions {
  undo(): void;
  redo(): void;
  $resetUndoRedo(): void;
  addCommands(commands: UndoRedoCommands[]): void;
  executeCommand(index: number, type: 'undo' | 'redo'): void;
}

export type UndoRedoStoreSlice = UndoRedoSliceState & UndoRedoSliceActions;

const initialState: UndoRedoSliceState = {
  history: [],
  historyIndex: -1,
};

export const createUndoRedoStoreSlice: StateCreator<
  WorkflowEditorStore,
  [],
  [],
  UndoRedoStoreSlice
> = (set, get) => ({
  ...initialState,
  executeCommand(index, type) {
    const { workflow, updateWorkflow, history } = get();
    if (!workflow) return;

    const command = history.at(index);
    if (!command) return;

    switch (command.type) {
      case 'node-move': {
        const positions =
          type === 'undo' ? command.oldPositions : command.positions;
        const nodes = workflow.nodes.map((node) => {
          const position = positions.get(node.id);
          if (!position) return node;

          return {
            ...node,
            position,
          };
        });
        updateWorkflow({ nodes });
        break;
      }
      case 'node-removed':
      case 'node-added': {
        let nodes = [...workflow.nodes];
        if (
          (command.type === 'node-added' && type === 'redo') ||
          (command.type === 'node-removed' && type === 'undo')
        ) {
          nodes.push(...command.nodes);
        } else {
          nodes = nodes.filter(
            (node) => !command.nodes.some((item) => item.id === node.id),
          );
        }
        updateWorkflow({ nodes });
        break;
      }
      case 'edge-removed':
      case 'edge-added': {
        let edges = [...workflow.edges];
        if (
          (command.type === 'edge-added' && type === 'redo') ||
          (command.type === 'edge-removed' && type === 'undo')
        ) {
          edges.push(...command.edges);
        } else {
          edges = edges.filter(
            (node) => !command.edges.some((item) => item.id === node.id),
          );
        }
        updateWorkflow({ edges });
        break;
      }
    }
  },
  addCommands(commands) {
    const { historyIndex, history } = get();

    let historyCopy = [...history];
    if (historyIndex < historyCopy.length - 1) {
      historyCopy = historyCopy.slice(0, historyIndex + 1);
    }

    historyCopy.push(...commands);
    set({ history: historyCopy, historyIndex: historyCopy.length - 1 });
  },
  redo() {
    const { history, historyIndex, executeCommand } = get();
    if (historyIndex > history.length - 1) return;

    executeCommand(historyIndex, 'redo');

    set({ historyIndex: historyIndex + 1 });
  },
  undo() {
    const { historyIndex, executeCommand } = get();
    if (historyIndex < 0) return;

    executeCommand(historyIndex, 'undo');
    set({ historyIndex: historyIndex - 1 });
  },
  $resetUndoRedo() {
    set(initialState);
  },
});
