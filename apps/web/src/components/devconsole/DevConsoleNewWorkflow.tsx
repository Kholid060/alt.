import AppSocketService from '@/services/app-socket.service';
import {
  UiDialog,
  UiButton,
  UiSkeleton,
  UiLogo,
  UiInput,
  UiListItem,
  UiList,
  useToast,
} from '@alt-dot/ui';
import {
  UiListProvider,
  useUiListStore,
} from '@alt-dot/ui/dist/context/list.context';
import { useCallback, useEffect, useState } from 'react';
import bugFixingSvg from '@/assets/svg/bug-fixing.svg';
import WorkflowIcon from '../workflow/WorkflowIcon';
import { useNavigate } from '@tanstack/react-router';

function WorkflowsList() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const uiListStore = useUiListStore();

  const [wsState, setWsState] = useState<
    'connected' | 'connecting' | 'not-available'
  >('connecting');
  const [workflows, setWorkflows] = useState<UiListItem[]>([]);

  const fetchWorkflows = useCallback(async () => {
    try {
      const socketAvailable = await AppSocketService.instance
        .whenConnected()
        .then(() => true)
        .catch(() => false);
      if (!socketAvailable) {
        setWsState('not-available');
        return;
      }

      const result =
        await AppSocketService.instance.emitWithAck('workflows:list');
      setWorkflows(
        result.map((item) => ({
          value: item.id,
          title: item.name,
          subtitle: item.description ?? '',
          icon: <WorkflowIcon icon={item.icon} svgClass="size-4" />,
        })),
      );

      setWsState('connected');
    } catch (error) {
      console.error(error);
      setWsState('not-available');
    }
  }, []);

  async function onItemSelected(workflowId: string) {
    try {
      const workflow = await AppSocketService.instance.emitWithAck(
        'workflows:get',
        workflowId,
      );
      if ('notFound' in workflow) {
        toast({
          variant: 'destructive',
          title: "Couldn't find workflow data",
        });
        return;
      }

      navigate({
        to: '/devconsole/workflows/new',
        state: { newWorkflow: workflow },
      });
    } catch (error) {
      toast({
        title: 'Error!',
        variant: 'destructive',
        description: 'Error when trying to fetch workflow from the app',
      });
      console.error(error);
    }
  }

  useEffect(() => {
    fetchWorkflows();
  }, [fetchWorkflows]);

  if (wsState === 'connecting') {
    return (
      <div className="space-y-2">
        <UiSkeleton className="h-10 rounded-md" />
        <UiSkeleton className="h-10 rounded-md" />
        <UiSkeleton className="h-10 rounded-md" />
        <UiSkeleton className="h-10 rounded-md" />
      </div>
    );
  }
  if (wsState === 'not-available') {
    return (
      <div className="flex flex-col justify-center items-center">
        <img alt="error illustration" src={bugFixingSvg} className="h-48" />
        <h3 className="font-semibold">
          Can&apos;t connect to the <UiLogo /> app
        </h3>
        <p className="text-sm text-muted-foreground text-center">
          Make sure you have installed the <UiLogo /> app or the app is open
        </p>
        <UiButton
          className="min-w-40 mt-4"
          variant="secondary"
          onClick={() => {
            setWsState('connecting');
            fetchWorkflows();
          }}
        >
          Try again
        </UiButton>
      </div>
    );
  }

  return (
    <div>
      <UiInput
        placeholder="Search..."
        onValueChange={(value) => uiListStore.setState('search', value)}
        onKeyDown={(event) =>
          uiListStore.listControllerKeyBind(event.nativeEvent)
        }
      />
      <UiList
        className="mt-2 max-h-64 overflow-auto"
        items={workflows}
        onItemSelected={onItemSelected}
      />
    </div>
  );
}

function DevConsoleNewWorkflow({ onClose }: { onClose?: () => void }) {
  return (
    <UiDialog open onOpenChange={(value) => !value && onClose?.()}>
      <UiDialog.Content className="sm:max-w-[425px] z-[101]">
        <UiDialog.Header>
          <UiDialog.Title>Share workflow</UiDialog.Title>
          <UiDialog.Description>
            Select a workflow you want to share
          </UiDialog.Description>
        </UiDialog.Header>
        <UiListProvider>
          <WorkflowsList />
        </UiListProvider>
      </UiDialog.Content>
    </UiDialog>
  );
}

export default DevConsoleNewWorkflow;
