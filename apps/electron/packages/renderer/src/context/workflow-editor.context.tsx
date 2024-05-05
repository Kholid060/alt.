import { EventEmitter } from 'eventemitter3';
import { createContext, useEffect, useRef } from 'react';
import {
  WorkflowEditorEvents,
  XYPosition,
} from '../interface/workflow-editor.interface';

export interface WorkflowEditorContextState {
  event: EventEmitter<WorkflowEditorEvents>;
  lastMousePos: React.MutableRefObject<XYPosition>;
}

export const WorkflowEditorContext = createContext<WorkflowEditorContextState>({
  event: new EventEmitter(),
  lastMousePos: { current: { x: 0, y: 0 } },
});

export function WorkflowEditorProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const lastMousePos = useRef<XYPosition>({ x: 0, y: 0 });
  const eventEmitter = useRef(new EventEmitter<WorkflowEditorEvents>());

  useEffect(() => {
    const onMousemove = ({ clientX, clientY }: MouseEvent) => {
      lastMousePos.current = { x: clientX, y: clientY };
    };
    window.addEventListener('mousemove', onMousemove);

    return () => {
      window.removeEventListener('mousemove', onMousemove);
    };
  }, []);

  return (
    <WorkflowEditorContext.Provider
      value={{
        lastMousePos: lastMousePos,
        event: eventEmitter.current,
      }}
    >
      {children}
    </WorkflowEditorContext.Provider>
  );
}
