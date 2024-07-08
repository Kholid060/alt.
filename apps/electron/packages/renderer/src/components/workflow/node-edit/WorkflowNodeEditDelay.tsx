import { WorkflowNodeDelay } from '@altdot/workflow';
import { UiInput } from '@altdot/ui';
import { useWorkflowEditorStore } from '../../../stores/workflow-editor/workflow-editor.store';
import WorkflowUiFormExpression from '../ui/WorkflowUiFormExpression';
import WorkflowNodeLayoutEdit from './WorkflowNodeLayoutEdit';
import { WORKFLOW_NODE_TYPE } from '@altdot/workflow';

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
        onDataChange={($expData) => updateEditNode({ $expData })}
      >
        <UiInput
          value={node.data.delayMs}
          id="delay--time"
          min={0}
          inputSize="sm"
          type="number"
          placeholder="1000"
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
