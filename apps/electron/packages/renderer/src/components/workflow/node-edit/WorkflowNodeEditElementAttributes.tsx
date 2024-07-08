import { WorkflowNodeElementAttributes } from '@altdot/workflow';
import {
  UiButton,
  UiInput,
  UiLabel,
  UiSelect,
  UiSwitch,
  UiTextarea,
} from '@altdot/ui';
import { useWorkflowEditorStore } from '../../../stores/workflow-editor/workflow-editor.store';
import WorkflowUiFormExpression from '../ui/WorkflowUiFormExpression';
import WorkflowNodeLayoutEdit from './WorkflowNodeLayoutEdit';
import { WORKFLOW_NODE_TYPE } from '@altdot/workflow';
import WorkflowUiCodeEditor from '../ui/WorkflowUiCodeEditor';

type ActionComponent = React.FC<{
  data: WorkflowNodeElementAttributes['data'];
  onUpdate(data: Partial<WorkflowNodeElementAttributes['data']>): void;
}>;

const SetAttributes: ActionComponent = ({ data, onUpdate }) => {
  function updateItem(index: number, key: 'name' | 'value', value: string) {
    const setAttrs = (data.setAttrs ?? []).toSpliced(index, 1, {
      ...data.setAttrs[index],
      [key]: value,
    });
    onUpdate({
      setAttrs,
    });
  }
  function deleteItem(index: number) {
    const copyExp = { ...(data.$expData ?? {}) };
    delete copyExp[`setAttrs[${index}].name`];
    delete copyExp[`setAttrs[${index}].value`];

    const setAttrs = data.setAttrs.toSpliced(index, 1);
    onUpdate({ setAttrs, $setAttrsExp: copyExp });
  }
  function addAttribute() {
    onUpdate({
      setAttrs: [...data.setAttrs, { name: '', value: '' }],
    });
  }

  return (
    <>
      <div className="flex items-center">
        <p className="flex-grow font-semibold">Attributes</p>
        <div className="flex items-center gap-2">
          <UiSwitch
            checked={data.useSetAttrsJSON}
            onCheckedChange={(checked) =>
              onUpdate({ useSetAttrsJSON: checked })
            }
            id="el-attrs--json-input"
            size="sm"
          />
          <UiLabel htmlFor="el-attrs--json-input">JSON Input</UiLabel>
        </div>
      </div>
      {data.useSetAttrsJSON ? (
        <WorkflowUiFormExpression
          className="mt-4"
          path="setAttrsJSON"
          data={data.$setAttrsExp}
          onDataChange={(data) => onUpdate({ $setAttrsExp: data })}
        >
          <WorkflowUiCodeEditor
            lang="json"
            value={data.setAttrsJSON}
            placeholder='{ "attr-a": "value-1" }'
            onValueChange={(value) => onUpdate({ setAttrsJSON: value })}
          />
        </WorkflowUiFormExpression>
      ) : (
        <>
          <ul className="mt-3 space-y-4">
            {data.setAttrs.map((item, index) => (
              <li key={index} className="group/header">
                <WorkflowUiFormExpression
                  data={data.$setAttrsExp}
                  path={`setAttrs[${index}].name`}
                  labelChildren={
                    <button
                      onClick={() => deleteItem(index)}
                      className="invisible ml-1 py-px text-destructive-text underline group-focus-within/header:visible group-hover/header:visible"
                    >
                      Delete
                    </button>
                  }
                  inputClass="rounded-b-none border-b-0"
                  className="flex-1"
                  onDataChange={(data) => onUpdate({ $setAttrsExp: data })}
                >
                  <UiInput
                    value={item.name}
                    inputSize="sm"
                    title="Name"
                    className="flex-1 rounded-b-none border-b-0"
                    placeholder="Attribute name"
                    onValueChange={(value) => updateItem(index, 'name', value)}
                  />
                </WorkflowUiFormExpression>
                <WorkflowUiFormExpression
                  data={data.$setAttrsExp}
                  path={`setAttrs[${index}].value`}
                  labelPosition="bottom"
                  className="relative"
                  labelClass="absolute right-0 -mt-1"
                  inputClass="rounded-t-none"
                  onDataChange={(data) => onUpdate({ $setAttrsExp: data })}
                >
                  <UiInput
                    value={item.value}
                    inputSize="sm"
                    className="rounded-t-none"
                    placeholder="Attribute value"
                    title="Value"
                    onValueChange={(value) => updateItem(index, 'value', value)}
                  />
                </WorkflowUiFormExpression>
              </li>
            ))}
          </ul>
          <div className="mt-8 text-right">
            <UiButton
              size="sm"
              variant="secondary"
              onClick={addAttribute}
              className="min-w-28"
            >
              Add attribute
            </UiButton>
          </div>
        </>
      )}
    </>
  );
};

const GetAttributes: ActionComponent = ({ data, onUpdate }) => {
  return (
    <WorkflowUiFormExpression
      data={data.$expData}
      path="getAttrs"
      className="mt-2"
      label="Attribute names"
      labelId="el-attrs--selector"
      onDataChange={($expData) => onUpdate({ $expData })}
    >
      <UiTextarea
        value={data.getAttrs}
        id="el-attrs--selector"
        placeholder="attr-a,attr-b,attr-c"
        onChange={(event) => onUpdate({ getAttrs: event.target.value })}
      />
      <p className="ml-1 text-xs text-muted-foreground">
        Use commas to separate the attribute names
      </p>
    </WorkflowUiFormExpression>
  );
};

function WorkflowNodeEditDelay() {
  const node =
    useWorkflowEditorStore.use.editNode() as WorkflowNodeElementAttributes;
  const updateEditNode = useWorkflowEditorStore.use.updateEditNode();

  return (
    <WorkflowNodeLayoutEdit node={node}>
      <UiLabel className="ml-1" htmlFor="el-attrs--action">
        Action
      </UiLabel>
      <UiSelect
        id="el-attrs--action"
        inputSize="sm"
        value={node.data.action}
        onValueChange={(value) =>
          updateEditNode({
            action: value as WorkflowNodeElementAttributes['data']['action'],
          })
        }
      >
        <UiSelect.Option value="get">Get attributes</UiSelect.Option>
        <UiSelect.Option value="set">Set attributes</UiSelect.Option>
      </UiSelect>
      <WorkflowUiFormExpression
        data={node.data.$expData}
        path="selector"
        className="mt-2"
        label="Element selector"
        labelId="el-attrs--selector"
        onDataChange={($expData) =>
          updateEditNode<WorkflowNodeElementAttributes>({ $expData })
        }
      >
        <UiInput
          value={node.data.selector}
          id="el-attrs--selector"
          placeholder=".element"
          inputSize="sm"
          onValueChange={(value) =>
            updateEditNode<WorkflowNodeElementAttributes>({ selector: value })
          }
        />
      </WorkflowUiFormExpression>
      <hr className="my-4" />
      {node.data.action === 'get' ? (
        <GetAttributes data={node.data} onUpdate={updateEditNode} />
      ) : (
        <SetAttributes data={node.data} onUpdate={updateEditNode} />
      )}
    </WorkflowNodeLayoutEdit>
  );
}
WorkflowNodeEditDelay.type = WORKFLOW_NODE_TYPE.ELEMENT_ATTRIBUTES;

export default WorkflowNodeEditDelay;
