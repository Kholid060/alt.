import { WorkflowNodeCode } from '#packages/common/interface/workflow-nodes.interface';
import { useWorkflowEditorStore } from '../../../stores/workflow-editor/workflow-editor.store';
import { WORKFLOW_NODE_TYPE } from '#packages/common/utils/constant/workflow.const';
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
