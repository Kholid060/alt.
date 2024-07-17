import { WorkflowNodeGetElementText } from '@altdot/workflow';
import { UiInput, UiLabel, UiSelect, UiSwitch } from '@altdot/ui';
import { useWorkflowEditorStore } from '../../../stores/workflow-editor/workflow-editor.store';
import WorkflowUiFormExpression from '../ui/WorkflowUiFormExpression';
import WorkflowNodeLayoutEdit from './WorkflowNodeLayoutEdit';
import { WORKFLOW_NODE_TYPE } from '@altdot/workflow/dist/const/workflow-nodes-type.const';

const actions: {
  name: string;
  id: WorkflowNodeGetElementText['data']['action'];
}[] = [
  { id: 'get-text', name: 'Get Text' },
  { id: 'get-html', name: 'Get HTML' },
];

function WorkflowNodeEditDelay() {
  const node =
    useWorkflowEditorStore.use.editNode() as WorkflowNodeGetElementText;
  const updateEditNode = useWorkflowEditorStore.use.updateEditNode();

  return (
    <WorkflowNodeLayoutEdit node={node}>
      <UiLabel className="ml-1" htmlFor="get-text--action">
        Action
      </UiLabel>
      <UiSelect
        id="get-text--action"
        inputSize="sm"
        value={node.data.action}
        onValueChange={(value) =>
          updateEditNode({
            action: value as WorkflowNodeGetElementText['data']['action'],
          })
        }
      >
        {actions.map((item) => (
          <UiSelect.Option key={item.id} value={item.id}>
            {item.name}
          </UiSelect.Option>
        ))}
      </UiSelect>
      <WorkflowUiFormExpression
        data={node.data.$expData}
        path="selector"
        className="mt-3"
        label="Element selector"
        labelId="get-text--selector"
        onDataChange={($expData) =>
          updateEditNode<WorkflowNodeGetElementText>({ $expData })
        }
      >
        <UiInput
          value={node.data.selector}
          id="get-text--selector"
          placeholder=".element"
          inputSize="sm"
          onValueChange={(value) =>
            updateEditNode<WorkflowNodeGetElementText>({ selector: value })
          }
        />
      </WorkflowUiFormExpression>
      <hr className="my-4" />
      {node.data.action === 'get-text' ? (
        <WorkflowUiFormExpression
          data={node.data.$expData}
          path="visibleTextOnly"
          label="Get visible text only"
          labelId="get-text--visible"
        >
          <UiSwitch
            size="sm"
            id="get-text--visible"
            checked={node.data.visibleTextOnly}
            onCheckedChange={(checked) =>
              updateEditNode<WorkflowNodeGetElementText>({
                visibleTextOnly: checked,
              })
            }
          />
        </WorkflowUiFormExpression>
      ) : (
        <WorkflowUiFormExpression
          data={node.data.$expData}
          path="outerHTML"
          label="Get outer HTML"
          labelId="get-text--outer-html"
        >
          <UiSwitch
            size="sm"
            id="get-text--outer-html"
            checked={node.data.outerHTML}
            onCheckedChange={(checked) =>
              updateEditNode<WorkflowNodeGetElementText>({ outerHTML: checked })
            }
          />
        </WorkflowUiFormExpression>
      )}
    </WorkflowNodeLayoutEdit>
  );
}
WorkflowNodeEditDelay.type = WORKFLOW_NODE_TYPE.GET_ELEMENT_TEXT;

export default WorkflowNodeEditDelay;
