import { EventEmitter } from 'eventemitter3';
import { createContext, useRef } from 'react';
import { WorkflowEditorEvents } from '../interface/workflow-editor.interface';

export interface WorkflowEditorContextState {
  event: EventEmitter<WorkflowEditorEvents>;
}

export const WorkflowEditorContext = createContext<WorkflowEditorContextState>({
  event: new EventEmitter(),
});

export function WorkflowEditorProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const eventEmitter = useRef(new EventEmitter<WorkflowEditorEvents>());

  return (
    <WorkflowEditorContext.Provider value={{ event: eventEmitter.current }}>
      {children}
    </WorkflowEditorContext.Provider>
  );
}
