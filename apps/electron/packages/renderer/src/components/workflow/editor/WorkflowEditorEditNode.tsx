import { useShallow } from 'zustand/react/shallow';
import { useWorkflowEditorStore } from '../../../stores/workflow-editor/workflow-editor.store';
import { Suspense, lazy, memo } from 'react';
import { XIcon } from 'lucide-react';
import { UiSkeleton } from '@alt-dot/ui';
import kebabCase from 'lodash-es/kebabCase';
import WorkflowNodeLayoutEdit from '../node-edit/WorkflowNodeLayoutEdit';
import { WorkflowNodes } from '@alt-dot/workflow';

const editComponents = Object.fromEntries(
  Object.entries(import.meta.glob('../node-edit/WorkflowNodeEdit*.tsx')).map(
    ([key, value]) => {
      const compName =
        key
          .split('/')
          .at(-1)
          ?.replaceAll(/WorkflowNodeEdit|.tsx/g, '') ?? '';

      return [
        `node-${kebabCase(compName)}`,
        lazy(value as () => Promise<{ default: React.FC }>),
      ];
    },
  ),
);

function Loading() {
  return (
    <div className="p-4">
      <div className="flex items-center gap-2">
        <UiSkeleton className="h-10 w-10" />
        <div className="flex-grow">
          <UiSkeleton className="h-4 w-7/12" />
          <UiSkeleton className="mt-1.5 h-4 w-5/12" />
        </div>
      </div>
      <UiSkeleton className="mt-6 h-9 w-full" />
      <UiSkeleton className="mt-4 h-9 w-full" />
      <UiSkeleton className="mt-4 h-9 w-full" />
    </div>
  );
}

function WorkflowEditNodeDefault() {
  const node = useWorkflowEditorStore.use.editNode() as WorkflowNodes;

  return (
    <WorkflowNodeLayoutEdit node={node}>
      <p className="py-4 text-center text-muted-foreground">
        This node doesn&apos;t have parameters
      </p>
    </WorkflowNodeLayoutEdit>
  );
}

function WorkflowEditorEditNode() {
  const editNode = useWorkflowEditorStore(
    useShallow((state) =>
      state.editNode
        ? { type: state.editNode.type, id: state.editNode.id }
        : null,
    ),
  );
  const setEditNode = useWorkflowEditorStore.use.setEditNode();

  const EditComponent = editNode
    ? editComponents[editNode.type] || WorkflowEditNodeDefault
    : null;
  if (!EditComponent || !editNode) return null;

  return (
    <div className="absolute right-0 top-0 z-50 h-full w-[340px] border-l bg-background text-sm">
      <button
        onClick={() => setEditNode(null)}
        className="absolute left-0 top-0 -translate-x-full rounded-bl-md border-b border-l bg-background p-1.5 text-muted-foreground"
      >
        <XIcon className="h-5 w-5" />
      </button>
      <Suspense fallback={<Loading />}>
        <EditComponent key={editNode.id} />
      </Suspense>
    </div>
  );
}

export default memo(WorkflowEditorEditNode);
