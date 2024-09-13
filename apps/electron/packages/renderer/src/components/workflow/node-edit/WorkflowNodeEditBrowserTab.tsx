import { WorkflowNodeBrowserTab } from '@altdot/workflow';
import { UiInput, UiLabel, UiSelect } from '@altdot/ui';
import { useWorkflowEditorStore } from '../../../stores/workflow-editor/workflow-editor.store';
import WorkflowUiFormExpression from '../ui/WorkflowUiFormExpression';
import WorkflowNodeLayoutEdit from './WorkflowNodeLayoutEdit';
import { WORKFLOW_NODE_TYPE } from '@altdot/workflow/dist/const/workflow-nodes-type.const';
import { InfoIcon } from 'lucide-react';

const actions: {
  name: string;
  id: WorkflowNodeBrowserTab['data']['action'];
}[] = [
  { id: 'use-active-tab', name: 'Use the active tab' },
  { id: 'find-tab', name: 'Find tab' },
  { id: 'open-tab', name: 'Create a new tab' },
];

function WorkflowNodeEditBrowserTab() {
  const node = useWorkflowEditorStore.use.editNode() as WorkflowNodeBrowserTab;
  const updateEditNode = useWorkflowEditorStore.use.updateEditNode();

  return (
    <WorkflowNodeLayoutEdit node={node}>
      <UiLabel htmlFor="browser-tab--action" className="ml-1">
        Action
      </UiLabel>
      <UiSelect
        inputSize="sm"
        id="browser-tab--action"
        value={node.data.action}
        onValueChange={(value) =>
          updateEditNode<WorkflowNodeBrowserTab>({
            action: value as WorkflowNodeBrowserTab['data']['action'],
          })
        }
      >
        {actions.map((action) => (
          <UiSelect.Option key={action.id} value={action.id}>
            {action.name}
          </UiSelect.Option>
        ))}
      </UiSelect>
      <hr className="my-4" />
      {node.data.action === 'open-tab' && (
        <WorkflowUiFormExpression
          data={node.data.$expData}
          label="New tab URL"
          path="newTabURL"
          labelId="browser-tab--url"
          onDataChange={($expData) => updateEditNode({ $expData })}
        >
          <UiInput
            value={node.data.newTabURL}
            id="browser-tab--url"
            inputSize="sm"
            type="url"
            placeholder="https://example.com"
            onValueChange={(value) =>
              updateEditNode<WorkflowNodeBrowserTab>({ newTabURL: value })
            }
          />
        </WorkflowUiFormExpression>
      )}
      {node.data.action === 'find-tab' && (
        <WorkflowUiFormExpression
          data={node.data.$expData}
          path="findTabFilter"
          labelChildren={
            <>
              Match Patterns{' '}
              <a
                href="https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Match_patterns"
                target="_blank"
                rel="noreferrer"
              >
                <InfoIcon className="inline size-4" />
              </a>
            </>
          }
          labelId="browser-tab--tab-filter"
          onDataChange={($expData) => updateEditNode({ $expData })}
        >
          <UiInput
            value={node.data.findTabFiler}
            id="browser-tab--tab-filter"
            inputSize="sm"
            type="url"
            placeholder="*://example.com/*"
            onValueChange={(value) =>
              updateEditNode<WorkflowNodeBrowserTab>({ findTabFiler: value })
            }
          />
        </WorkflowUiFormExpression>
      )}
    </WorkflowNodeLayoutEdit>
  );
}
WorkflowNodeEditBrowserTab.type = WORKFLOW_NODE_TYPE.BROWSER_TAB;

export default WorkflowNodeEditBrowserTab;
