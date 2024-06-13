import {
  WorkflowNodeConditionPath,
  WorkflowNodeConditional,
} from '#packages/common/interface/workflow-nodes.interface';
import { UiButton, UiDialog } from '@alt-dot/ui';
import WorkflowNodeLayoutEdit from './WorkflowNodeLayoutEdit';
import { useWorkflowEditorStore } from '../../../stores/workflow-editor/workflow-editor.store';
import { PencilIcon, SignpostIcon, TrashIcon } from 'lucide-react';
import { useState } from 'react';
import WorkflowUiConditionBuilder from '../ui/WorkflowUiConditionBuilder';
import UiStateView from '../../ui/UiStateView';
import { nanoid } from 'nanoid/non-secure';

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
        <p className="font-semibold flex-1">Conditions path</p>
        <UiButton size="sm" variant="secondary" onClick={addPath}>
          Add path
        </UiButton>
      </div>
      <ul className="mt-4">
        {node.data.conditions.map((condition, index) => (
          <li
            key={condition.id}
            className="flex items-center group rounded-sm hover:bg-secondary/50 h-10 text-muted-foreground hover:text-foreground"
          >
            <button
              className="flex-1 px-2 h-full flex items-center text-left gap-2"
              onClick={() => setOpen(index)}
            >
              <SignpostIcon />
              <p className="flex-1 line-clamp-1">{condition.name}</p>
            </button>
            <button
              title="Delete path"
              className="invisible group-hover:visible focus:visible pr-2"
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
            className="space-y-4 mt-8"
          />
        )}
      </ul>
      <UiDialog modal open={open !== null} onOpenChange={() => setOpen(null)}>
        {open !== null && (
          <UiDialog.Content className="max-w-2xl p-0">
            <UiDialog.Header className="px-6 pt-6">
              <UiDialog.Title className="flex items-center relative">
                <PencilIcon className="h-5 w-5 text-muted-foreground absolute left-2 pointer-events-none" />
                <input
                  type="text"
                  value={node.data.conditions[open].name}
                  onChange={({ target }) => updatePath({ name: target.value })}
                  className="h-9 focus:bg-secondary hover:bg-secondary focus:outline-none pl-9 rounded-md"
                />
              </UiDialog.Title>
              <UiDialog.Description>
                Add or modify path conditions
              </UiDialog.Description>
            </UiDialog.Header>
            <div
              className="px-6 pb-6 overflow-auto"
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
