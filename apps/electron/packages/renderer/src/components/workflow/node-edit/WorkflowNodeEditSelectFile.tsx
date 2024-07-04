import { WorkflowNodeSelectFile } from '@alt-dot/workflow';
import { UiButton, UiInput, UiLabel, UiSwitch } from '@alt-dot/ui';
import { useWorkflowEditorStore } from '../../../stores/workflow-editor/workflow-editor.store';
import WorkflowUiFormExpression from '../ui/WorkflowUiFormExpression';
import WorkflowNodeLayoutEdit from './WorkflowNodeLayoutEdit';
import { WORKFLOW_NODE_TYPE } from '@alt-dot/workflow';
import { TrashIcon } from 'lucide-react';
import WorkflowUiCodeEditor from '../ui/WorkflowUiCodeEditor';

function WorkflowNodeEditSelectFile() {
  const node = useWorkflowEditorStore.use.editNode() as WorkflowNodeSelectFile;
  const updateEditNode = useWorkflowEditorStore.use.updateEditNode();

  function deleteFile(index: number) {
    const files = node.data.files.toSpliced(index, 1);

    const copyExp = { ...(node.data.$expData ?? {}) };
    delete copyExp[`files[${index}]`];

    updateEditNode<WorkflowNodeSelectFile>({
      files,
      $expData: copyExp,
    });
  }

  return (
    <WorkflowNodeLayoutEdit node={node}>
      <WorkflowUiFormExpression
        data={node.data.$expData}
        path="selector"
        label="Element selector"
        labelId="browser-select-file--selector"
        onDataChange={($expData) =>
          updateEditNode<WorkflowNodeSelectFile>({ $expData })
        }
      >
        <UiInput
          value={node.data.selector}
          id="browser-select-file--selector"
          placeholder='input[type="file"]'
          inputSize="sm"
          onValueChange={(value) =>
            updateEditNode<WorkflowNodeSelectFile>({ selector: value })
          }
        />
      </WorkflowUiFormExpression>
      <hr className="my-4" />
      <div className="flex items-center">
        <p className="flex-grow font-semibold">Files</p>
        <div className="flex items-center gap-2">
          <UiSwitch
            checked={node.data.mode === 'json'}
            onCheckedChange={(checked) =>
              updateEditNode<WorkflowNodeSelectFile>({
                mode: checked ? 'json' : 'list',
              })
            }
            id="browser-select-file--json-input"
            size="sm"
          />
          <UiLabel htmlFor="browser-select-file--json-input">
            JSON Input
          </UiLabel>
        </div>
      </div>
      {node.data.mode === 'json' ? (
        <WorkflowUiFormExpression
          className="mt-4"
          path="setAttrsJSON"
          data={node.data.$expData}
          onDataChange={(data) =>
            updateEditNode<WorkflowNodeSelectFile>({ $expData: data })
          }
        >
          <WorkflowUiCodeEditor
            lang="json"
            title="File paths"
            value={node.data.jsonInput}
            placeholder='["D:\file.txt"]'
            onValueChange={(value) =>
              updateEditNode<WorkflowNodeSelectFile>({ jsonInput: value })
            }
          />
        </WorkflowUiFormExpression>
      ) : (
        <>
          <ul className="mt-4 space-y-2">
            {node.data.files.map((file, index) => (
              <li key={index} className="flex items-start">
                <WorkflowUiFormExpression
                  data={node.data.$expData}
                  path={`files[${index}]`}
                  label="File path"
                  className="flex-1"
                  labelId={`browser-select-file--file-${index}`}
                  onDataChange={($expData) =>
                    updateEditNode<WorkflowNodeSelectFile>({ $expData })
                  }
                >
                  <UiInput
                    value={file}
                    id={`browser-select-file--file-${index}`}
                    placeholder={`D:\\file-${index + 1}.txt`}
                    inputSize="sm"
                    onValueChange={(value) =>
                      updateEditNode<WorkflowNodeSelectFile>({
                        files: node.data.files.toSpliced(index, 1, value),
                      })
                    }
                  />
                </WorkflowUiFormExpression>
                <UiButton
                  size="icon-sm"
                  className="ml-2 mt-5"
                  variant="ghost"
                  onClick={() => deleteFile(index)}
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
                updateEditNode<WorkflowNodeSelectFile>({
                  files: [...node.data.files, ''],
                })
              }
              className="min-w-28"
            >
              Add file
            </UiButton>
          </div>
        </>
      )}
    </WorkflowNodeLayoutEdit>
  );
}
WorkflowNodeEditSelectFile.type = WORKFLOW_NODE_TYPE.SELECT_FILE;

export default WorkflowNodeEditSelectFile;
