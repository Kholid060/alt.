import { WorkflowNodeUseBrowser } from '@alt-dot/workflow';
import { UiSelect, UiSwitch } from '@alt-dot/ui';
import { useWorkflowEditorStore } from '../../../stores/workflow-editor/workflow-editor.store';
import WorkflowUiFormExpression from '../ui/WorkflowUiFormExpression';
import WorkflowNodeLayoutEdit from './WorkflowNodeLayoutEdit';
import { WORKFLOW_NODE_TYPE } from '@alt-dot/workflow';

function WorkflowNodeEditUseBrowser() {
  const node = useWorkflowEditorStore.use.editNode() as WorkflowNodeUseBrowser;
  const updateEditNode = useWorkflowEditorStore.use.updateEditNode();

  return (
    <WorkflowNodeLayoutEdit node={node}>
      <div className="space-y-4">
        {false && (
          <WorkflowUiFormExpression
            data={node.data.$expData}
            label="Use opened browser"
            path="openIfNotExists"
            labelId="open-browser--opened-browser"
            onDataChange={($expData) => updateEditNode({ $expData })}
          >
            <UiSwitch
              checked={node.data.useOpenedBrowser}
              id="open-browser--opened-browser"
              onCheckedChange={(value) =>
                updateEditNode<WorkflowNodeUseBrowser>({
                  useOpenedBrowser: value,
                })
              }
            />
          </WorkflowUiFormExpression>
        )}
        <WorkflowUiFormExpression
          data={node.data.$expData}
          label="Preferred browser"
          path="preferBrowser"
          labelId="open-browser--prefer"
          onDataChange={($expData) => updateEditNode({ $expData })}
        >
          <UiSelect
            value={node.data.preferBrowser}
            id="open-browser--prefer"
            inputSize="sm"
            onValueChange={(value) =>
              updateEditNode<WorkflowNodeUseBrowser>({
                preferBrowser:
                  value as WorkflowNodeUseBrowser['data']['preferBrowser'],
              })
            }
          >
            <UiSelect.Option value="any">Any supported browser</UiSelect.Option>
            <UiSelect.Option value="chrome">Google Chrome</UiSelect.Option>
            <UiSelect.Option value="firefox">Mozilla Firefox</UiSelect.Option>
            <UiSelect.Option value="edge">Microsoft Edge</UiSelect.Option>
          </UiSelect>
        </WorkflowUiFormExpression>
      </div>
    </WorkflowNodeLayoutEdit>
  );
}
WorkflowNodeEditUseBrowser.type = WORKFLOW_NODE_TYPE.USE_BROWSER;

export default WorkflowNodeEditUseBrowser;
