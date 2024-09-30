import { WorkflowNodeBrowserSelect } from '@altdot/workflow';
import { UiButton, UiInput, UiLabel, UiSwitch } from '@altdot/ui';
import { useWorkflowEditorStore } from '../../../stores/workflow-editor/workflow-editor.store';
import WorkflowUiFormExpression from '../ui/WorkflowUiFormExpression';
import WorkflowNodeLayoutEdit from './WorkflowNodeLayoutEdit';
import { WORKFLOW_NODE_TYPE } from '@altdot/workflow/dist/const/workflow-nodes-type.const';
import { TrashIcon } from 'lucide-react';
import WorkflowUiCodeEditor from '../ui/WorkflowUiCodeEditor';

function WorkflowNodeEditSelectFile() {
  const node =
    useWorkflowEditorStore.use.editNode() as WorkflowNodeBrowserSelect;
  const updateEditNode = useWorkflowEditorStore.use.updateEditNode();

  function deleteValue(index: number) {
    const values = node.data.values.toSpliced(index, 1);

    const copyExp = { ...(node.data.$expData ?? {}) };
    delete copyExp[`files[${index}]`];

    updateEditNode<WorkflowNodeBrowserSelect>({
      values,
      $expData: copyExp,
    });
  }

  return (
    <WorkflowNodeLayoutEdit node={node}>
      <WorkflowUiFormExpression
        data={node.data.$expData}
        path="selector"
        label="Element selector"
        labelId="browser-select--selector"
        onDataChange={($expData) =>
          updateEditNode<WorkflowNodeBrowserSelect>({ $expData })
        }
      >
        <UiInput
          value={node.data.selector}
          id="browser-select--selector"
          placeholder="select"
          inputSize="sm"
          onValueChange={(value) =>
            updateEditNode<WorkflowNodeBrowserSelect>({ selector: value })
          }
        />
      </WorkflowUiFormExpression>
      <hr className="my-4" />
      <div className="flex items-center">
        <p className="flex-grow font-semibold">Options</p>
        <div className="flex items-center gap-2">
          <UiSwitch
            checked={node.data.mode === 'json'}
            onCheckedChange={(checked) =>
              updateEditNode<WorkflowNodeBrowserSelect>({
                mode: checked ? 'json' : 'list',
              })
            }
            id="browser-select--json-input"
            size="sm"
          />
          <UiLabel htmlFor="browser-select--json-input">JSON Input</UiLabel>
        </div>
      </div>
      {node.data.mode === 'json' ? (
        <WorkflowUiFormExpression
          className="mt-4"
          path="setAttrsJSON"
          data={node.data.$expData}
          onDataChange={(data) =>
            updateEditNode<WorkflowNodeBrowserSelect>({ $expData: data })
          }
        >
          <WorkflowUiCodeEditor
            lang="json"
            title="Values"
            value={node.data.jsonInput}
            placeholder='["option-1", "option-2"]'
            onValueChange={(value) =>
              updateEditNode<WorkflowNodeBrowserSelect>({ jsonInput: value })
            }
          />
        </WorkflowUiFormExpression>
      ) : (
        <>
          <ul className="mt-4 space-y-2">
            {node.data.values.map((file, index) => (
              <li key={index} className="flex items-start">
                <WorkflowUiFormExpression
                  data={node.data.$expData}
                  path={`files[${index}]`}
                  label="Option"
                  className="flex-1"
                  labelId={`browser-select--file-${index}`}
                  onDataChange={($expData) =>
                    updateEditNode<WorkflowNodeBrowserSelect>({ $expData })
                  }
                >
                  <UiInput
                    value={file}
                    id={`browser-select--file-${index}`}
                    placeholder={`option-${index + 1}`}
                    inputSize="sm"
                    onValueChange={(value) =>
                      updateEditNode<WorkflowNodeBrowserSelect>({
                        values: node.data.values.toSpliced(index, 1, value),
                      })
                    }
                  />
                </WorkflowUiFormExpression>
                <UiButton
                  size="icon-sm"
                  className="ml-2 mt-5"
                  variant="ghost"
                  onClick={() => deleteValue(index)}
                >
                  <TrashIcon className="h-5 w-5" />
                </UiButton>
              </li>
            ))}
          </ul>
          <div className="mt-8 text-right">
            <UiButton
              size="sm"
              variant="secondary"
              onClick={() =>
                updateEditNode<WorkflowNodeBrowserSelect>({
                  values: [...node.data.values, ''],
                })
              }
              className="min-w-28"
            >
              Add option
            </UiButton>
          </div>
        </>
      )}
    </WorkflowNodeLayoutEdit>
  );
}
WorkflowNodeEditSelectFile.type = WORKFLOW_NODE_TYPE.SELECT_FILE;

export default WorkflowNodeEditSelectFile;
