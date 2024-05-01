import { WORKFLOW_NODE_TYPE } from '#packages/common/utils/constant/constant';
import { useShallow } from 'zustand/react/shallow';
import WorkflowNodeEditCommand from '../node/WorkflowNodeEditCommand';
import { useWorkflowEditorStore } from '/@/stores/workflow-editor.store';
import { memo } from 'react';
import { XIcon } from 'lucide-react';

const editNodeComponentMap: Record<WORKFLOW_NODE_TYPE, React.FC | null> = {
  [WORKFLOW_NODE_TYPE.TRIGGER]: null,
  [WORKFLOW_NODE_TYPE.COMMAND]: WorkflowNodeEditCommand,
};

function WorkflowEditorEditNode() {
  const editNode = useWorkflowEditorStore(
    useShallow((state) =>
      state.editNode
        ? { type: state.editNode.type, id: state.editNode.id }
        : null,
    ),
  );
  const setEditNode = useWorkflowEditorStore.use.setEditNode();

  const EditComponent = editNode && editNodeComponentMap[editNode.type];
  if (!EditComponent) return null;

  return (
    <div className="absolute right-0 h-full w-80 z-50 top-0 bg-background border-l text-sm">
      <button
        onClick={() => setEditNode(null)}
        className="absolute top-0 left-0 p-1.5 -translate-x-full rounded-bl-md border-l border-b text-muted-foreground bg-background"
      >
        <XIcon className="h-5 w-5" />
      </button>
      <EditComponent />
    </div>
  );
}

export default memo(WorkflowEditorEditNode);
