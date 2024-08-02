import {
  WorkflowNodeCommand,
  WorkflowNodes,
} from '@/interface/workflow-nodes.interface';
import { createContext, useContext } from 'react';

export interface NodeData<T extends WorkflowNodes = WorkflowNodes> {
  id: string;
  data: T['data'];
}

export interface WorkflowNodesContextState {
  hideToolbar?: boolean;
  onDeleteNode?(nodeData: NodeData): void;
  onCopyNode?(nodeData: NodeData[]): void;
  onRunWorkflow?(nodeData: NodeData): void;
  resolveExtIcon(nodeData: NodeData<WorkflowNodeCommand>): React.ReactNode;
  extCommandChecker(commandId: string): {
    cancel: () => void;
    result: Promise<boolean>;
  };
  onToggleDisable?(nodeData: NodeData, isDisabled: boolean): void;
  onOpenContextMenu?(nodeData: NodeData, event: React.MouseEvent): void;
}

// @ts-expect-error will validate the value when use hook
const WorkflowNodesContext = createContext<WorkflowNodesContextState>();

export function useWorkflowNodes() {
  const context = useContext(WorkflowNodesContext);
  if (!context) {
    throw new Error('Missing WorkflowNodesProvider in the tree');
  }

  return context;
}

export function WorkflowNodesProvider({
  children,
  ...rest
}: {
  children?: React.ReactNode;
} & WorkflowNodesContextState) {
  return (
    <WorkflowNodesContext.Provider value={rest}>
      {children}
    </WorkflowNodesContext.Provider>
  );
}
