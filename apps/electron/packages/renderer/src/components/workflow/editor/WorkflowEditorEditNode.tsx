import { useShallow } from 'zustand/react/shallow';
import { useWorkflowEditorStore } from '/@/stores/workflow-editor.store';
import { Suspense, lazy, memo } from 'react';
import { XIcon } from 'lucide-react';
import { UiSkeleton } from '@repo/ui';
import kebabCase from 'lodash-es/kebabCase';

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
          <UiSkeleton className="h-4 w-5/12 mt-1.5" />
        </div>
      </div>
      <UiSkeleton className="h-9 w-full mt-6" />
      <UiSkeleton className="h-9 w-full mt-4" />
      <UiSkeleton className="h-9 w-full mt-4" />
    </div>
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

  const EditComponent = editNode && editComponents[editNode.type];
  if (!EditComponent) return null;

  return (
    <div className="absolute right-0 h-full w-[340px] z-50 top-0 bg-background border-l text-sm">
      <button
        onClick={() => setEditNode(null)}
        className="absolute top-0 left-0 p-1.5 -translate-x-full rounded-bl-md border-l border-b text-muted-foreground bg-background"
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
