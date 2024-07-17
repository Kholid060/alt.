import { WorkflowNodeWaitSelector } from '@altdot/workflow';
import { UiInput, UiSelect } from '@altdot/ui';
import { useWorkflowEditorStore } from '../../../stores/workflow-editor/workflow-editor.store';
import WorkflowUiFormExpression from '../ui/WorkflowUiFormExpression';
import WorkflowNodeLayoutEdit from './WorkflowNodeLayoutEdit';
import { WORKFLOW_NODE_TYPE } from '@altdot/workflow/dist/const/workflow-nodes-type.const';

const elStates: {
  id: WorkflowNodeWaitSelector['data']['state'];
  name: string;
}[] = [
  { id: 'hidden', name: 'Element hidden' },
  { id: 'visible', name: 'Element visible' },
  { id: 'attached', name: 'Element attached' },
  { id: 'detached', name: 'Element detached' },
];

function WorkflowNodeEditDelay() {
  const node =
    useWorkflowEditorStore.use.editNode() as WorkflowNodeWaitSelector;
  const updateEditNode = useWorkflowEditorStore.use.updateEditNode();

  return (
    <WorkflowNodeLayoutEdit node={node}>
      <WorkflowUiFormExpression
        data={node.data.$expData}
        path="state"
        label="Element state"
        labelId="wait-selector--state"
        onDataChange={($expData) =>
          updateEditNode<WorkflowNodeWaitSelector>({ $expData })
        }
      >
        <UiSelect
          id="wait-selector--state"
          inputSize="sm"
          value={node.data.state}
          onValueChange={(value) =>
            updateEditNode({
              state: value as WorkflowNodeWaitSelector['data']['state'],
            })
          }
        >
          {elStates.map((item) => (
            <UiSelect.Option key={item.id} value={item.id}>
              {item.name}
            </UiSelect.Option>
          ))}
        </UiSelect>
      </WorkflowUiFormExpression>
      <WorkflowUiFormExpression
        data={node.data.$expData}
        path="selector"
        className="mt-4"
        label="Element selector"
        labelId="wait-selector--selector"
        onDataChange={($expData) =>
          updateEditNode<WorkflowNodeWaitSelector>({ $expData })
        }
      >
        <UiInput
          value={node.data.selector}
          id="wait-selector--selector"
          placeholder=".element"
          inputSize="sm"
          onValueChange={(value) =>
            updateEditNode<WorkflowNodeWaitSelector>({ selector: value })
          }
        />
      </WorkflowUiFormExpression>
      <WorkflowUiFormExpression
        data={node.data.$expData}
        path="timeout"
        label="Timeout (MS)"
        className="mt-4"
        labelId="wait-timeout--timeout"
        onDataChange={($expData) =>
          updateEditNode<WorkflowNodeWaitSelector>({ $expData })
        }
      >
        <UiInput
          value={node.data.timeout}
          min="0"
          id="wait-selector--timeout"
          placeholder="1000"
          inputSize="sm"
          type="number"
          onValueChange={(value) =>
            updateEditNode<WorkflowNodeWaitSelector>({ timeout: +value })
          }
        />
      </WorkflowUiFormExpression>
    </WorkflowNodeLayoutEdit>
  );
}
WorkflowNodeEditDelay.type = WORKFLOW_NODE_TYPE.BROWSER_MOUSE;

export default WorkflowNodeEditDelay;
