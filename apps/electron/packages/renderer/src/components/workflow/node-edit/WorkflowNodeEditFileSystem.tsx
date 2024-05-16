import { WorkflowNodeFileSystem } from '#packages/common/interface/workflow-nodes.interface';
import { UiInput, UiLabel, UiSelect, UiSwitch } from '@repo/ui';
import { useWorkflowEditorStore } from '../../../stores/workflow-editor/workflow-editor.store';
import WorkflowUiFormExpression from '../ui/WorkflowUiFormExpression';
import WorkflowNodeLayoutEdit from './WorkflowNodeLayoutEdit';
import { WORKFLOW_NODE_TYPE } from '#packages/common/utils/constant/workflow.const';

type Data = WorkflowNodeFileSystem['data'];

const actions: {
  id: Data['action'];
  name: string;
}[] = [
  { id: 'read', name: 'Read file' },
  { id: 'write', name: 'Write file' },
];

function WorkflowNodeEditDelay() {
  const node = useWorkflowEditorStore.use.editNode() as WorkflowNodeFileSystem;
  const updateEditNode = useWorkflowEditorStore.use.updateEditNode();

  return (
    <WorkflowNodeLayoutEdit node={node}>
      <UiLabel htmlFor="fs--action" className="ml-1">
        Action
      </UiLabel>
      <UiSelect
        inputSize="sm"
        value={node.data.action}
        onValueChange={(value) =>
          updateEditNode<WorkflowNodeFileSystem>({
            action: value as Data['action'],
          })
        }
      >
        {actions.map((action) => (
          <UiSelect.Option key={action.id} value={action.id}>
            {action.name}
          </UiSelect.Option>
        ))}
      </UiSelect>
      {node.data.action === 'write' && (
        <div className="flex items-center justify-between mt-4">
          <UiLabel htmlFor="fs--append">Append</UiLabel>
          <UiSwitch
            size="sm"
            id="fs--append"
            checked={node.data.appendFile}
            onCheckedChange={(appendFile) =>
              updateEditNode<WorkflowNodeFileSystem>({ appendFile })
            }
          />
        </div>
      )}
      <hr className="my-4" />
      <WorkflowUiFormExpression
        data={node.data.$expData}
        label="File path"
        path="filePath"
        labelId="fs--file-path"
        onDataChange={($expData) => updateEditNode({ $expData })}
      >
        <UiInput
          value={node.data.filePath}
          id="fs--file-path"
          inputSize="sm"
          placeholder="D:\documents\file.txt"
          onValueChange={(value) =>
            updateEditNode<WorkflowNodeFileSystem>({ filePath: value })
          }
        />
      </WorkflowUiFormExpression>
      {node.data.action === 'write' && (
        <WorkflowUiFormExpression
          data={node.data.$expData}
          label="File data"
          path="fileData"
          className="mt-4"
          labelId="fs--file-path"
          onDataChange={($expData) => updateEditNode({ $expData })}
        >
          <UiInput
            value={node.data.fileData}
            id="fs--file-path"
            inputSize="sm"
            placeholder="data"
            onValueChange={(value) =>
              updateEditNode<WorkflowNodeFileSystem>({ fileData: value })
            }
          />
        </WorkflowUiFormExpression>
      )}
      {node.data.action === 'read' && (
        <div className="mt-4">
          <div className="flex items-center justify-between">
            <UiLabel className="ml-1" htmlFor="http-assign-var">
              Assign file to variable
            </UiLabel>
            <UiSwitch
              size="sm"
              id="http-assign-var"
              checked={node.data.insertToVar}
              onCheckedChange={(insertToVar) =>
                updateEditNode<WorkflowNodeFileSystem>({ insertToVar })
              }
            />
          </div>
          <UiInput
            value={node.data.varName}
            min={0}
            inputSize="sm"
            className="mt-1"
            placeholder="Variable name"
            disabled={!node.data.insertToVar}
            onValueChange={(value) =>
              updateEditNode<WorkflowNodeFileSystem>({ varName: value })
            }
          />
        </div>
      )}
    </WorkflowNodeLayoutEdit>
  );
}
WorkflowNodeEditDelay.type = WORKFLOW_NODE_TYPE.DELAY;

export default WorkflowNodeEditDelay;
