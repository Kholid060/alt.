import {
  WorkflowNodeInsertData,
  WorkflowNodeInsertDataItem,
} from '@alt-dot/workflow';
import {
  UiButton,
  UiInput,
  UiLabel,
  UiPopover,
  UiPopoverContent,
  UiPopoverTrigger,
  UiSelect,
} from '@alt-dot/ui';
import { useWorkflowEditorStore } from '../../../stores/workflow-editor/workflow-editor.store';
import WorkflowUiFormExpression from '../ui/WorkflowUiFormExpression';
import WorkflowNodeLayoutEdit from './WorkflowNodeLayoutEdit';
import { WORKFLOW_NODE_TYPE } from '@alt-dot/workflow';
import { nanoid } from 'nanoid/non-secure';
import { EllipsisVerticalIcon, PlusIcon } from 'lucide-react';

function WorkflowNodeEditInsertData() {
  const node = useWorkflowEditorStore.use.editNode() as WorkflowNodeInsertData;
  const updateEditNode = useWorkflowEditorStore.use.updateEditNode();

  function addItem() {
    updateEditNode<WorkflowNodeInsertData>({
      items: [
        ...node.data.items,
        {
          name: '',
          value: '',
          id: nanoid(5),
          mode: 'replace',
        },
      ],
    });
  }
  function updateItem(
    index: number,
    key: keyof Omit<WorkflowNodeInsertDataItem, 'id'>,
    value: string,
  ) {
    const items = (node.data.items ?? []).toSpliced(index, 1, {
      ...node.data.items[index],
      [key]: value,
    });
    updateEditNode<WorkflowNodeInsertData>({
      items,
    });
  }
  function deleteItem(index: number) {
    const copyExp = { ...(node.data.$expData ?? {}) };
    delete copyExp[`items[${index}].name`];
    delete copyExp[`items[${index}].value`];

    const items = node.data.items.toSpliced(index, 1);
    updateEditNode<WorkflowNodeInsertData>({ items, $expData: copyExp });
  }

  return (
    <WorkflowNodeLayoutEdit node={node}>
      <div className="flex items-center justify-between">
        <p className="font-semibold">Items</p>
        <UiButton variant="secondary" size="sm" onClick={addItem}>
          <PlusIcon className="mr-2 h-5 w-5 -ml-1" />
          Add
        </UiButton>
      </div>
      <ul className="mt-3 space-y-2">
        {node.data.items.map((item, index) => (
          <li key={index} className="group/header">
            <div className="flex items-end">
              <WorkflowUiFormExpression
                data={node.data.$expData}
                path={`items[${index}].name`}
                labelChildren={
                  <button
                    onClick={() => deleteItem(index)}
                    className="underline text-destructive-text ml-1 py-px group-focus-within/header:visible group-hover/header:visible invisible"
                  >
                    Delete
                  </button>
                }
                inputClass="rounded-b-none border-b-0"
                className="flex-1"
                onDataChange={(data) => updateEditNode({ $expData: data })}
              >
                <UiInput
                  value={item.name}
                  inputSize="sm"
                  title="Name"
                  className="rounded-b-none rounded-r-none border-r-0 border-b-0 flex-1"
                  placeholder="Variable name"
                  onValueChange={(value) => updateItem(index, 'name', value)}
                />
              </WorkflowUiFormExpression>
              <UiPopover>
                <UiPopoverTrigger asChild>
                  <UiButton
                    size="icon-sm"
                    variant="outline"
                    className="border-b-0 rounded-l-none rounded-br-none"
                  >
                    <EllipsisVerticalIcon className="h-5 w-5" />
                  </UiButton>
                </UiPopoverTrigger>
                <UiPopoverContent align="end" className="text-sm">
                  <UiLabel className="ml-1">Mode</UiLabel>
                  <UiSelect
                    inputSize="sm"
                    value={item.mode}
                    onValueChange={(value) => updateItem(index, 'mode', value)}
                  >
                    <UiSelect.Option value="replace">Replace</UiSelect.Option>
                    <UiSelect.Option value="append">Append</UiSelect.Option>
                  </UiSelect>
                </UiPopoverContent>
              </UiPopover>
            </div>
            <WorkflowUiFormExpression
              data={node.data.$expData}
              path={`items[${index}].value`}
              labelPosition="bottom"
              className="relative"
              labelClass="absolute right-0 -mt-1"
              inputClass="rounded-t-none"
              onDataChange={(data) =>
                updateEditNode<WorkflowNodeInsertData>({ $expData: data })
              }
            >
              <UiInput
                value={item.value}
                inputSize="sm"
                className="rounded-t-none"
                placeholder="Variable value"
                title="Value"
                onValueChange={(value) => updateItem(index, 'value', value)}
              />
            </WorkflowUiFormExpression>
          </li>
        ))}
      </ul>
    </WorkflowNodeLayoutEdit>
  );
}
WorkflowNodeEditInsertData.type = WORKFLOW_NODE_TYPE.INSERT_DATA;

export default WorkflowNodeEditInsertData;
