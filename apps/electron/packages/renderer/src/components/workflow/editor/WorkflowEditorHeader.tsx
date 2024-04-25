import { UiButton, useToast } from '@repo/ui';
import { ChevronLeftIcon, PlayIcon, RedoIcon, UndoIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useWorkflowEditorStore } from '/@/stores/workflow-editor.store';
import { UiExtIcon } from '@repo/extension';
import dayjs from 'dayjs';
import { useEffect, useRef, useState } from 'react';
import preloadAPI from '/@/utils/preloadAPI';
import { WORKFLOW_NODE_TYPE } from '#packages/common/utils/constant/constant';

function SavedTimeText() {
  const intervalRef = useRef<NodeJS.Timeout>();

  const [text, setText] = useState('');

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      const date = useWorkflowEditorStore.getState().workflowLastSavedAt;
      if (!date) return;

      setText(dayjs(date).fromNow());
    }, 30_000); // 30 seconds

    return () => {
      clearInterval(intervalRef.current);
    };
  }, []);

  if (!text) return null;

  return <p className="text-xs text-muted-foreground ml-2">Saved {text}</p>;
}

function WorkflowEditorHeader() {
  const workflow = useWorkflowEditorStore.use.workflow()!;

  const { toast } = useToast();

  function runWorkflow() {
    const manualTriggerNode = workflow.nodes.find(
      (node) =>
        node.type === WORKFLOW_NODE_TYPE.TRIGGER && node.data.type === 'manual',
    );
    if (!manualTriggerNode) {
      toast({
        variant: 'destructive',
        title: "Couldn't find a Manual Trigger node",
        description: 'Add a Manual Trigger node to run the workflow manually',
      });
      return;
    }

    preloadAPI.main
      .invokeIpcMessage('workflow:run', {
        id: workflow.id,
        startNodeId: manualTriggerNode.id,
      })
      .catch((error) => {
        console.error(error);
        toast({
          variant: 'destructive',
          title: 'Something went wrong!',
          description: (
            <p className="line-clamp-2">{`Something went wrong when running the "${workflow.name}" workfow`}</p>
          ),
        });
      });
  }

  const WorkflowIcon =
    UiExtIcon[workflow.icon as keyof typeof UiExtIcon] ?? UiExtIcon.Command;

  return (
    <header className="h-20 border-b flex items-center px-4">
      <UiButton
        variant="outline"
        size="icon-sm"
        className="flex-shrink-0"
        asChild
      >
        <Link to="/workflows">
          <ChevronLeftIcon className="h-5 w-5" />
        </Link>
      </UiButton>
      <hr className="h-2/6 bg-border/50 w-px mx-4" />
      <div className="inline-flex items-center justify-center h-10 w-10 bg-card rounded-md flex-shrink-0">
        <WorkflowIcon />
      </div>
      <div className="ml-2 flex-grow mr-4">
        <h2 className="font-semibold line-clamp-1">{workflow.name}</h2>
        <p className="text-muted-foreground text-xs leading-tight line-clamp-1">
          {workflow.description}
        </p>
      </div>
      <UiButton variant="ghost" size="icon" disabled>
        <UndoIcon className="h-5 w-5" />
      </UiButton>
      <UiButton variant="ghost" size="icon" className="ml-1">
        <RedoIcon className="h-5 w-5" />
      </UiButton>
      <SavedTimeText />
      <hr className="h-2/6 bg-border/50 w-px mx-4" />
      <UiButton variant="secondary" onClick={runWorkflow}>
        <PlayIcon className="h-4 w-4 mr-2 -ml-0.5" />
        <p>Run</p>
      </UiButton>
      <UiButton className="ml-2">Publish</UiButton>
    </header>
  );
}

export default WorkflowEditorHeader;
