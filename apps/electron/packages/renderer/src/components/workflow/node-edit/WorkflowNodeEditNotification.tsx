import { WorkflowNodeNotification } from '@altdot/workflow';
import { UiInput, UiSwitch } from '@altdot/ui';
import { useWorkflowEditorStore } from '../../../stores/workflow-editor/workflow-editor.store';
import WorkflowUiFormExpression from '../ui/WorkflowUiFormExpression';
import WorkflowNodeLayoutEdit from './WorkflowNodeLayoutEdit';
import { WORKFLOW_NODE_TYPE } from '@altdot/workflow/dist/const/workflow-nodes-type.const';

const fields: { id: 'title' | 'body'; name: string }[] = [
  { id: 'title', name: 'Title' },
  { id: 'body', name: 'Body' },
];

function WorkflowNodeEditNotification() {
  const node =
    useWorkflowEditorStore.use.editNode() as WorkflowNodeNotification;
  const updateEditNode = useWorkflowEditorStore.use.updateEditNode();

  return (
    <WorkflowNodeLayoutEdit node={node}>
      <div className="space-y-4">
        {fields.map((field) => (
          <WorkflowUiFormExpression
            key={field.id}
            data={node.data.$expData}
            label={field.name}
            path={field.id}
            labelId={`notification--${field.id}`}
            onDataChange={($expData) => updateEditNode({ $expData })}
          >
            <UiInput
              value={node.data[field.id]}
              id={`notification--${field.id}`}
              inputSize="sm"
              placeholder={`Notification ${field.name.toLowerCase()}`}
              onValueChange={(value) =>
                updateEditNode<WorkflowNodeNotification>({
                  [field.id]: value,
                })
              }
            />
          </WorkflowUiFormExpression>
        ))}
        <WorkflowUiFormExpression
          data={node.data.$expData}
          label="Silent"
          path="silent"
          labelId="notification--silent"
          onDataChange={($expData) => updateEditNode({ $expData })}
        >
          <UiSwitch
            checked={node.data.silent}
            onCheckedChange={(silent) =>
              updateEditNode<WorkflowNodeNotification>({ silent })
            }
          />
        </WorkflowUiFormExpression>
      </div>
    </WorkflowNodeLayoutEdit>
  );
}
WorkflowNodeEditNotification.type = WORKFLOW_NODE_TYPE.NOTIFICATION;

export default WorkflowNodeEditNotification;
