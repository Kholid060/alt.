import { UiButton, useToast } from '@repo/ui';
import { ChevronLeftIcon, PlayIcon, RedoIcon, UndoIcon } from 'lucide-react';
import {
  Link,
  useBlocker,
  useNavigate,
  useSearchParams,
} from 'react-router-dom';
import { useWorkflowEditorStore } from '/@/stores/workflow-editor.store';
import { UiExtIcon } from '@repo/extension';
import { useWorkflowEditor } from '/@/hooks/useWorkflowEditor';
import { isIPCEventError } from '#packages/common/utils/helper';
import { DatabaseWorkflowUpdatePayload } from '#packages/main/src/interface/database.interface';
import preloadAPI from '/@/utils/preloadAPI';
import { useEffect } from 'react';

function WorkflowInformation() {
  const workflow = useWorkflowEditorStore.use.workflow();

  if (!workflow) return null;

  const WorkflowIcon =
    UiExtIcon[workflow.icon as keyof typeof UiExtIcon] ?? UiExtIcon.Command;

  return (
    <>
      <div className="inline-flex items-center justify-center h-10 w-10 bg-card rounded-md flex-shrink-0">
        <WorkflowIcon />
      </div>
      <div className="ml-2 flex-grow mr-4">
        <h2 className="font-semibold line-clamp-1">{workflow.name}</h2>
        <p className="text-muted-foreground text-xs leading-tight line-clamp-1">
          {workflow.description}
        </p>
      </div>
    </>
  );
}

function WorkflowEditorHeader() {
  const enableWorkflowSaveBtn =
    useWorkflowEditorStore.use.enableWorkflowSaveBtn();
  const toggleSaveWorkflowBtn =
    useWorkflowEditorStore.use.toggleSaveWorkflowBtn();

  const { toast } = useToast();
  const navigate = useNavigate();
  const { runCurrentWorkflow } = useWorkflowEditor();
  const [_searchParams, setSearchParams] = useSearchParams();

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      enableWorkflowSaveBtn &&
      currentLocation.pathname !== nextLocation.pathname,
  );

  async function saveWorkflow() {
    try {
      const { workflow } = useWorkflowEditorStore.getState();
      if (!workflow) return;

      const { workflowChanges: changes, clearWorkflowChanges } =
        useWorkflowEditorStore.getState();
      if (changes.size === 0) return;

      const payload: DatabaseWorkflowUpdatePayload = {};
      changes.forEach((key) => {
        //@ts-expect-error ...
        payload[key] = workflow[key];
      });

      const result = await preloadAPI.main.ipc.invoke(
        'database:update-workflow',
        workflow.id,
        payload,
      );
      clearWorkflowChanges();

      if (isIPCEventError(result)) {
        toast({
          title: 'Error',
          variant: 'destructive',
          description: result.message,
        });
        return;
      }

      toggleSaveWorkflowBtn(false);
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Something went wrong' });
    }
  }

  useEffect(() => {
    if (blocker.state === 'blocked') {
      const isConfirmed = window.confirm(
        "Exit editor? There some changes haven't been saved",
      );

      if (isConfirmed) blocker.proceed();
      else blocker.reset();
    } else if (blocker.state === 'proceeding') {
      navigate(blocker.location.pathname.replace('/dashboard', ''));
    }
  }, [blocker, navigate]);

  useEffect(() => {
    const params = new URLSearchParams();
    params.append('preventCloseWindow', `${enableWorkflowSaveBtn}`);

    setSearchParams(params);
  }, [enableWorkflowSaveBtn, setSearchParams]);

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
      <WorkflowInformation />
      <UiButton variant="ghost" size="icon" disabled>
        <UndoIcon className="h-5 w-5" />
      </UiButton>
      <UiButton variant="ghost" size="icon" className="ml-1">
        <RedoIcon className="h-5 w-5" />
      </UiButton>
      <hr className="h-2/6 bg-border/50 w-px mx-4" />
      <UiButton variant="secondary" onClick={() => runCurrentWorkflow()}>
        <PlayIcon className="h-4 w-4 mr-2 -ml-0.5" />
        <p>Run</p>
      </UiButton>
      <UiButton
        className="ml-2 min-w-20"
        disabled={!enableWorkflowSaveBtn}
        onClick={saveWorkflow}
      >
        Save
      </UiButton>
    </header>
  );
}

export default WorkflowEditorHeader;
