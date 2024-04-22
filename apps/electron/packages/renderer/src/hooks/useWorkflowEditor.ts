import { useContext } from 'react';
import { WorkflowEditorContext } from '../context/workflow-editor.context';

export function useWorkflowEditor() {
  const context = useContext(WorkflowEditorContext);

  return context;
}
