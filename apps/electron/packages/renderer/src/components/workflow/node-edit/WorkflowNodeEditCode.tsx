import { WorkflowNodeCode } from '@altdot/workflow';
import { useWorkflowEditorStore } from '../../../stores/workflow-editor/workflow-editor.store';
import { WORKFLOW_NODE_TYPE } from '@altdot/workflow';
import WorkflowNodeLayoutEdit from './WorkflowNodeLayoutEdit';
import WorkflowUiCodeEditor from '../ui/WorkflowUiCodeEditor';

function WorkflowNodeEditCode() {
  const node = useWorkflowEditorStore.use.editNode() as WorkflowNodeCode;
  const updateEditNode = useWorkflowEditorStore.use.updateEditNode();

  return (
    <WorkflowNodeLayoutEdit node={node}>
      <WorkflowUiCodeEditor
        lang="js"
        value={node.data.jsCode}
        onValueChange={(value) => updateEditNode({ jsCode: value })}
      />
    </WorkflowNodeLayoutEdit>
  );
}
WorkflowNodeEditCode.type = WORKFLOW_NODE_TYPE.CODE;

export default WorkflowNodeEditCode;
