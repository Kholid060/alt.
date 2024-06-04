import { WorkflowNodeBrowserMouse } from '#packages/common/interface/workflow-nodes.interface';
import { UiInput, UiLabel, UiSelect } from '@repo/ui';
import { useWorkflowEditorStore } from '../../../stores/workflow-editor/workflow-editor.store';
import WorkflowUiFormExpression from '../ui/WorkflowUiFormExpression';
import WorkflowNodeLayoutEdit from './WorkflowNodeLayoutEdit';
import { WORKFLOW_NODE_TYPE } from '#packages/common/utils/constant/workflow.const';

const mouseActions: {
  id: WorkflowNodeBrowserMouse['data']['action'];
  name: string;
}[] = [
  { id: 'click', name: 'Click' },
  { id: 'mouse-up', name: 'Mouse Up' },
  { id: 'mouse-down', name: 'Mouse Down' },
];

function WorkflowNodeEditDelay() {
  const node =
    useWorkflowEditorStore.use.editNode() as WorkflowNodeBrowserMouse;
  const updateEditNode = useWorkflowEditorStore.use.updateEditNode();

  return (
    <WorkflowNodeLayoutEdit node={node}>
      <UiLabel className="ml-1" htmlFor="clipboard-action">
        Action
      </UiLabel>
      <UiSelect
        id="clipboard-action"
        inputSize="sm"
        value={node.data.action}
        onValueChange={(value) =>
          updateEditNode({
            action: value as WorkflowNodeBrowserMouse['data']['action'],
          })
        }
      >
        {mouseActions.map((item) => (
          <UiSelect.Option key={item.id} value={item.id}>
            {item.name}
          </UiSelect.Option>
        ))}
      </UiSelect>
      <WorkflowUiFormExpression
        data={node.data.$expData}
        path="selector"
        className="mt-4"
        label="Element selector"
        labelId="browser-mouse--selector"
        onDataChange={($expData) =>
          updateEditNode<WorkflowNodeBrowserMouse>({ $expData })
        }
      >
        <UiInput
          value={node.data.selector}
          id="browser-mouse--selector"
          placeholder=".element"
          inputSize="sm"
          onValueChange={(value) =>
            updateEditNode<WorkflowNodeBrowserMouse>({ selector: value })
          }
        />
      </WorkflowUiFormExpression>
    </WorkflowNodeLayoutEdit>
  );
}
WorkflowNodeEditDelay.type = WORKFLOW_NODE_TYPE.BROWSER_MOUSE;

export default WorkflowNodeEditDelay;
