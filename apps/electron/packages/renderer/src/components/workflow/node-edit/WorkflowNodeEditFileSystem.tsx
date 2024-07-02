import { WorkflowNodeFileSystem } from '@alt-dot/workflow';
import { UiInput, UiLabel, UiSelect, UiSwitch } from '@alt-dot/ui';
import { useWorkflowEditorStore } from '../../../stores/workflow-editor/workflow-editor.store';
import WorkflowUiFormExpression from '../ui/WorkflowUiFormExpression';
import WorkflowNodeLayoutEdit from './WorkflowNodeLayoutEdit';
import { WORKFLOW_NODE_TYPE } from '@alt-dot/workflow';

type Data = WorkflowNodeFileSystem['data'];

const actions: {
  id: Data['action'];
  name: string;
}[] = [
  { id: 'read', name: 'Read file' },
  { id: 'write', name: 'Write file' },
  { id: 'stat', name: 'Stat' },
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
        <WorkflowUiFormExpression
          data={node.data.$expData}
          label="Append"
          path="appendFile"
          labelId="fs--append"
          className="mt-2"
          onDataChange={($expData) => updateEditNode({ $expData })}
        >
          <UiSwitch
            size="sm"
            id="fs--append"
            checked={node.data.appendFile}
            onCheckedChange={(appendFile) =>
              updateEditNode<WorkflowNodeFileSystem>({ appendFile })
            }
          />
        </WorkflowUiFormExpression>
      )}
      <hr className="my-4" />
      {node.data.action === 'read' || node.data.action === 'stat' ? (
        <div>
          <WorkflowUiFormExpression
            data={node.data.$expData}
            label="File pattern"
            path="readFilePath"
            labelId="fs--file-path"
            onDataChange={($expData) => updateEditNode({ $expData })}
          >
            <UiInput
              value={node.data.readFilePath}
              id="fs--file-path"
              inputSize="sm"
              placeholder="D:/documents/**/*.txt"
              onValueChange={(value) =>
                updateEditNode<WorkflowNodeFileSystem>({ readFilePath: value })
              }
            />
          </WorkflowUiFormExpression>
          <p className="text-xs text-muted-foreground">
            See supported{' '}
            <a
              href="https://github.com/isaacs/minimatch#usage"
              className="underline"
              target="_blank"
              rel="noreferrer"
            >
              patterns
            </a>
          </p>
        </div>
      ) : node.data.action === 'write' ? (
        <WorkflowUiFormExpression
          data={node.data.$expData}
          label="File path"
          path="writeFilePath"
          labelId="fs--file-path"
          onDataChange={($expData) => updateEditNode({ $expData })}
        >
          <UiInput
            value={node.data.writeFilePath}
            id="fs--file-path"
            inputSize="sm"
            placeholder="D:\documents\file.txt"
            onValueChange={(value) =>
              updateEditNode<WorkflowNodeFileSystem>({ writeFilePath: value })
            }
          />
        </WorkflowUiFormExpression>
      ) : null}
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
      {(node.data.action === 'read' || node.data.action === 'stat') && (
        <div className="mt-4">
          <WorkflowUiFormExpression
            data={node.data.$expData}
            label="Throw error if no match"
            path="throwIfEmpty"
            labelId="fs--throwIfEmpty"
            className="mt-2"
            onDataChange={($expData) => updateEditNode({ $expData })}
          >
            <UiSwitch
              size="sm"
              id="fs--throwIfEmpty"
              checked={node.data.throwIfEmpty}
              onCheckedChange={(throwIfEmpty) =>
                updateEditNode<WorkflowNodeFileSystem>({ throwIfEmpty })
              }
            />
          </WorkflowUiFormExpression>
        </div>
      )}
    </WorkflowNodeLayoutEdit>
  );
}
WorkflowNodeEditDelay.type = WORKFLOW_NODE_TYPE.DELAY;

export default WorkflowNodeEditDelay;
