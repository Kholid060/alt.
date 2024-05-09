import { WorkflowNodeDelay } from '#packages/common/interface/workflow-nodes.interface';
import { UiInput } from '@repo/ui';
import { useWorkflowEditorStore } from '/@/stores/workflow-editor.store';
import WorkflowUiFormExpression from '../ui/WorkflowUiFormExpression';
import WorkflowNodeLayoutEdit from './WorkflowNodeLayoutEdit';
import { WORKFLOW_NODE_TYPE } from '#packages/common/utils/constant/constant';

function WorkflowNodeEditDelay() {
  const node = useWorkflowEditorStore.use.editNode() as WorkflowNodeDelay;
  const updateEditNode = useWorkflowEditorStore.use.updateEditNode();

  return (
    <WorkflowNodeLayoutEdit node={node}>
      <WorkflowUiFormExpression
        data={node.data.$expData}
        label="Delay time (MS)"
        path="delayMs"
        labelId="delay--time"
      >
        <UiInput
          value={node.data.delayMs}
          id="delay--time"
          min={0}
          type="number"
          onValueChange={(value) =>
            updateEditNode({ delayMs: Math.max(0, +value) })
          }
        />
      </WorkflowUiFormExpression>
    </WorkflowNodeLayoutEdit>
  );
}
WorkflowNodeEditDelay.type = WORKFLOW_NODE_TYPE.DELAY;

export default WorkflowNodeEditDelay;
