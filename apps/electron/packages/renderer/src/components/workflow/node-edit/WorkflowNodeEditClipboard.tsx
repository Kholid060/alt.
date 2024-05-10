import { WorkflowNodeClipboard } from '#packages/common/interface/workflow-nodes.interface';
import { UiInput, UiLabel, UiSelect, UiSwitch } from '@repo/ui';
import { useWorkflowEditorStore } from '/@/stores/workflow-editor.store';
import WorkflowUiFormExpression from '../ui/WorkflowUiFormExpression';
import WorkflowNodeLayoutEdit from './WorkflowNodeLayoutEdit';
import ExtensionAPI from '@repo/extension-core/types/extension-api';

const EXT_CLIPBOARD_FORMATS: {
  format: ExtensionAPI.clipboard.ClipboardContentType;
  title: string;
}[] = [
  { format: 'text', title: 'Text' },
  { format: 'image', title: 'Image' },
  { format: 'html', title: 'HTML' },
  { format: 'rtf', title: 'Rich Text Format' },
];

type ClipboardComponent = React.FC<{
  node: WorkflowNodeClipboard;
  onUpdateNode: (data: Partial<WorkflowNodeClipboard['data']>) => void;
}>;

const ReadAction: ClipboardComponent = ({ node, onUpdateNode }) => {
  return (
    <>
      <div className="flex items-center justify-between">
        <UiLabel className="ml-1" htmlFor="clipboard-assign-var">
          Assign value to variable
        </UiLabel>
        <UiSwitch
          size="sm"
          id="clipboard-assign-var"
          checked={node.data.insertToVar}
          onCheckedChange={(insertToVar) => onUpdateNode({ insertToVar })}
        />
      </div>
      <UiInput
        value={node.data.varName}
        min={0}
        inputSize="sm"
        className="mt-1"
        placeholder="Variable name"
        disabled={!node.data.insertToVar}
        onValueChange={(value) => onUpdateNode({ varName: value })}
      />
    </>
  );
};

const WriteAction: ClipboardComponent = ({ node, onUpdateNode }) => {
  return (
    <>
      <WorkflowUiFormExpression
        data={node.data.$expData}
        label="Value"
        path="newClipboardVal"
        labelId="clipboard--value"
        onDataChange={($expData) => onUpdateNode({ $expData })}
      >
        <UiInput
          value={node.data.newClipboardVal}
          id="clipboard--value"
          placeholder="Some text..."
          onValueChange={(value) => onUpdateNode({ newClipboardVal: value })}
        />
      </WorkflowUiFormExpression>
    </>
  );
};

const actionComps: Record<
  WorkflowNodeClipboard['data']['action'],
  ClipboardComponent | null
> = {
  paste: null,
  read: ReadAction,
  write: WriteAction,
};

function WorkflowNodeEditClipboard() {
  const node = useWorkflowEditorStore.use.editNode() as WorkflowNodeClipboard;
  const updateEditNode = useWorkflowEditorStore.use.updateEditNode();

  const ActionComponent = actionComps[node.data.action];

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
            action: value as WorkflowNodeClipboard['data']['action'],
          })
        }
      >
        <UiSelect.Option value="read">Read clipboard</UiSelect.Option>
        <UiSelect.Option value="write">Write clipboard</UiSelect.Option>
        <UiSelect.Option value="paste">Paste clipboard</UiSelect.Option>
      </UiSelect>
      <hr className="my-4" />
      {node.data.action !== 'paste' && (
        <div className="mt-4">
          <UiLabel className="ml-1" htmlFor="clipboard-action">
            Clipboard format
          </UiLabel>
          <UiSelect
            id="clipboard-action"
            inputSize="sm"
            value={node.data.format}
            onValueChange={(value) =>
              updateEditNode({
                format: value as ExtensionAPI.clipboard.ClipboardContentType,
              })
            }
          >
            {EXT_CLIPBOARD_FORMATS.map((item) => (
              <UiSelect.Option key={item.format} value={item.format}>
                {item.title}
              </UiSelect.Option>
            ))}
          </UiSelect>
        </div>
      )}
      <div className="mt-4">
        {ActionComponent ? (
          <ActionComponent node={node} onUpdateNode={updateEditNode} />
        ) : null}
      </div>
    </WorkflowNodeLayoutEdit>
  );
}

export default WorkflowNodeEditClipboard;