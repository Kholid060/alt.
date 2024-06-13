import { WorkflowNodeBreakLoop } from '#packages/common/interface/workflow-nodes.interface';
import { UiInput } from '@alt-dot/ui';
import { useWorkflowEditorStore } from '../../../stores/workflow-editor/workflow-editor.store';
import WorkflowUiFormExpression from '../ui/WorkflowUiFormExpression';
import WorkflowNodeLayoutEdit from './WorkflowNodeLayoutEdit';
import { WORKFLOW_NODE_TYPE } from '#packages/common/utils/constant/workflow.const';

function WorkflowNodeEditDelay() {
  const node = useWorkflowEditorStore.use.editNode() as WorkflowNodeBreakLoop;
  const updateEditNode = useWorkflowEditorStore.use.updateEditNode();

  return (
    <WorkflowNodeLayoutEdit node={node}>
      <WorkflowUiFormExpression
        data={node.data.$expData}
        label="Looping node id"
        path="loopNodeId"
        labelId="break-loop--node-id"
        onDataChange={($expData) => updateEditNode({ $expData })}
      >
        <UiInput
          value={node.data.loopNodeId}
          id="break-loop--node-id"
          min={0}
          placeholder="yqiDK5K6Jy..."
          inputSize="sm"
          onValueChange={(value) =>
            updateEditNode<WorkflowNodeBreakLoop>({ loopNodeId: value })
          }
        />
      </WorkflowUiFormExpression>
    </WorkflowNodeLayoutEdit>
  );
}
WorkflowNodeEditDelay.type = WORKFLOW_NODE_TYPE.DELAY;

export default WorkflowNodeEditDelay;
