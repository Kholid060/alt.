import { UiButton, UiDialog } from '@alt-dot/ui';
import WorkflowNodeLayoutEdit from './WorkflowNodeLayoutEdit';
import { useWorkflowEditorStore } from '../../../stores/workflow-editor/workflow-editor.store';
import { PencilIcon, SignpostIcon, TrashIcon } from 'lucide-react';
import { useState } from 'react';
import WorkflowUiConditionBuilder from '../ui/WorkflowUiConditionBuilder';
import UiStateView from '../../ui/UiStateView';
import { nanoid } from 'nanoid/non-secure';
import {
  WorkflowNodeConditional,
  WorkflowNodeConditionPath,
} from '@alt-dot/workflow';

function WorkflowNodeEditConditional() {
  const node = useWorkflowEditorStore.use.editNode() as WorkflowNodeConditional;

  const deleteEdgeBy = useWorkflowEditorStore.use.deleteEdgeBy();
  const updateEditNode = useWorkflowEditorStore.use.updateEditNode();

  const [open, setOpen] = useState<number | null>(null);

  function addPath() {
    const paths: WorkflowNodeConditional['data']['conditions'] = [
      ...node.data.conditions,
      {
        items: [],
        id: nanoid(5),
        name: `Path ${node.data.conditions.length + 1}`,
      },
    ];
    updateEditNode<WorkflowNodeConditional>({
      conditions: paths,
    });
  }
  function deletePath(index: number) {
    const sourceHandle = `default:${node.data.conditions[index].id}`;
    deleteEdgeBy('sourceHandle', [sourceHandle]);

    const paths = node.data.conditions.toSpliced(index, 1);
    updateEditNode<WorkflowNodeConditional>({
      conditions: paths,
    });
  }
  function updatePath(data: Partial<Omit<WorkflowNodeConditionPath, 'id'>>) {
    if (typeof open !== 'number') return;

    const paths = node.data.conditions.toSpliced(open, 1, {
      ...node.data.conditions[open],
      ...data,
    });
    updateEditNode({ conditions: paths });
  }

  return (
    <WorkflowNodeLayoutEdit node={node}>
      <div className="flex items-center gap-2">
        <p className="flex-1 font-semibold">Conditions path</p>
        <UiButton size="sm" variant="secondary" onClick={addPath}>
          Add path
        </UiButton>
      </div>
      <ul className="mt-4">
        {node.data.conditions.map((condition, index) => (
          <li
            key={condition.id}
            className="group flex h-10 items-center rounded-sm text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
          >
            <button
              className="flex h-full flex-1 items-center gap-2 px-2 text-left"
              onClick={() => setOpen(index)}
            >
              <SignpostIcon />
              <p className="line-clamp-1 flex-1">{condition.name}</p>
            </button>
            <button
              title="Delete path"
              className="invisible pr-2 focus:visible group-hover:visible"
              onClick={() => deletePath(index)}
            >
              <TrashIcon className="h-5 w-5" />
            </button>
          </li>
        ))}
        {node.data.conditions.length === 0 && (
          <UiStateView
            type="empty"
            title="No condition paths"
            className="mt-8 space-y-4"
          />
        )}
      </ul>
      <UiDialog modal open={open !== null} onOpenChange={() => setOpen(null)}>
        {open !== null && (
          <UiDialog.Content className="max-w-2xl p-0">
            <UiDialog.Header className="px-6 pt-6">
              <UiDialog.Title className="relative flex items-center">
                <PencilIcon className="pointer-events-none absolute left-2 h-5 w-5 text-muted-foreground" />
                <input
                  type="text"
                  value={node.data.conditions[open].name}
                  onChange={({ target }) => updatePath({ name: target.value })}
                  className="h-9 rounded-md pl-9 hover:bg-secondary focus:bg-secondary focus:outline-none"
                />
              </UiDialog.Title>
              <UiDialog.Description>
                Add or modify path conditions
              </UiDialog.Description>
            </UiDialog.Header>
            <div
              className="overflow-auto px-6 pb-6"
              style={{ maxHeight: 'calc(100vh - 12rem)' }}
            >
              <WorkflowUiConditionBuilder
                items={node.data.conditions[open].items ?? []}
                onItemsChange={(items) => updatePath({ items })}
              />
            </div>
          </UiDialog.Content>
        )}
      </UiDialog>
    </WorkflowNodeLayoutEdit>
  );
}

export default WorkflowNodeEditConditional;
