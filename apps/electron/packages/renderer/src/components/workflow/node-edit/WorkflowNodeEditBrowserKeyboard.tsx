import { WorkflowNodeBrowserKeyboard } from '#packages/common/interface/workflow-nodes.interface';
import {
  UiCheckbox,
  UiInput,
  UiLabel,
  UiSelect,
  UiSwitch,
  UiTextarea,
} from '@repo/ui';
import { useWorkflowEditorStore } from '../../../stores/workflow-editor/workflow-editor.store';
import WorkflowUiFormExpression from '../ui/WorkflowUiFormExpression';
import WorkflowNodeLayoutEdit from './WorkflowNodeLayoutEdit';
import { WORKFLOW_NODE_TYPE } from '#packages/common/utils/constant/workflow.const';
import { KeyboardModifiers, USKeyboard, USKeyboardKeys } from '@repo/shared';
import { IS_MAC_OS } from '/@/utils/constant/constant';

const mouseActions: {
  id: WorkflowNodeBrowserKeyboard['data']['action'];
  name: string;
}[] = [
  { id: 'type', name: 'Typing' },
  { id: 'key-up', name: 'Key up' },
  { id: 'key-down', name: 'Key down' },
];
const keys = Object.keys(USKeyboard);
const keyModifiers: {
  name: string;
  id: KeyboardModifiers;
}[] = [
  { id: 'shift', name: 'Shift key' },
  { id: 'cmd', name: IS_MAC_OS ? 'CMD key' : 'Ctrl key' },
  { id: 'alt', name: 'Alt key' },
];

function WorkflowNodeEditDelay() {
  const node =
    useWorkflowEditorStore.use.editNode() as WorkflowNodeBrowserKeyboard;
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
            action: value as WorkflowNodeBrowserKeyboard['data']['action'],
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
        className="mt-2"
        label="Element selector"
        labelId="browser-keyboard--selector"
        onDataChange={($expData) =>
          updateEditNode<WorkflowNodeBrowserKeyboard>({ $expData })
        }
      >
        <UiInput
          value={node.data.selector}
          id="browser-keyboard--selector"
          placeholder=".element"
          inputSize="sm"
          onValueChange={(value) =>
            updateEditNode<WorkflowNodeBrowserKeyboard>({ selector: value })
          }
        />
      </WorkflowUiFormExpression>
      <hr className="my-4" />
      {node.data.action === 'type' ? (
        <>
          <WorkflowUiFormExpression
            data={node.data.$expData}
            path="text"
            className="mt-2"
            label="Text"
            labelId="browser-keyboard--text"
            onDataChange={($expData) =>
              updateEditNode<WorkflowNodeBrowserKeyboard>({ $expData })
            }
          >
            <UiTextarea
              value={node.data.text}
              id="browser-keyboard--text"
              placeholder="Text here"
              onChange={(event) =>
                updateEditNode<WorkflowNodeBrowserKeyboard>({
                  text: event.target.value,
                })
              }
            />
          </WorkflowUiFormExpression>
          <div className="flex items-center gap-2 mt-3">
            <UiSwitch
              id="browser-keyboard--clear-value"
              size="sm"
              checked={node.data.clearFormValue}
              onCheckedChange={(checked) =>
                updateEditNode<WorkflowNodeBrowserKeyboard>({
                  clearFormValue: Boolean(checked),
                })
              }
            />
            <UiLabel htmlFor="browser-keyboard--clear-value">
              Clear text field value
            </UiLabel>
          </div>
        </>
      ) : (
        <>
          <WorkflowUiFormExpression
            data={node.data.$expData}
            path="key"
            className="mt-2"
            label="Keyboard key"
            labelId="browser-keyboard--key"
            onDataChange={($expData) =>
              updateEditNode<WorkflowNodeBrowserKeyboard>({ $expData })
            }
          >
            <UiInput
              list="us-keys"
              value={node.data.key}
              id="browser-keyboard--key"
              inputSize="sm"
              className="appearance-none"
              onValueChange={(value) =>
                updateEditNode<WorkflowNodeBrowserKeyboard>({
                  key: value as USKeyboardKeys,
                })
              }
            />
            <datalist id="us-keys" className="max-h-64 overflow-auto">
              {keys.map((key) => (
                <option value={key} key={key} />
              ))}
            </datalist>
          </WorkflowUiFormExpression>
          <p className="mt-4 font-semibold">Key modifiers</p>
          <div className="grid grid-cols-2 gap-3 mt-2">
            {keyModifiers.map((modifier) => (
              <div className="flex items-center gap-1.5" key={modifier.id}>
                <UiCheckbox
                  id={`browser-keyboard--mod-${modifier.id}`}
                  checked={node.data.modifiers?.includes(modifier.id)}
                  onCheckedChange={(checked) =>
                    updateEditNode<WorkflowNodeBrowserKeyboard>({
                      modifiers: checked
                        ? [...node.data.modifiers, modifier.id]
                        : node.data.modifiers.filter(
                            (item) => item !== modifier.id,
                          ),
                    })
                  }
                />
                <UiLabel htmlFor={`browser-keyboard--mod-${modifier.id}`}>
                  {modifier.name}
                </UiLabel>
              </div>
            ))}
          </div>
        </>
      )}
    </WorkflowNodeLayoutEdit>
  );
}
WorkflowNodeEditDelay.type = WORKFLOW_NODE_TYPE.BROWSER_KEYBOARD;

export default WorkflowNodeEditDelay;