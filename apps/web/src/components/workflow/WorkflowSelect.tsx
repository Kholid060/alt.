import AppSocketService from '@/services/app-socket.service';
import {
  useToast,
  UiListItem,
  UiSkeleton,
  UiLogo,
  UiButton,
  UiInput,
  UiList,
} from '@alt-dot/ui';
import { useUiListStore } from '@alt-dot/ui/dist/context/list.context';
import bugFixingSvg from '@/assets/svg/bug-fixing.svg';
import { useState, useCallback, useEffect } from 'react';
import WorkflowIcon from './WorkflowIcon';
import { WebAppWorkflow } from '@alt-dot/shared';

function WorkflowSelect({
  onSelected,
}: {
  onSelected?: (workflow: WebAppWorkflow) => void;
}) {
  const { toast } = useToast();
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

      onSelected?.(workflow);
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

export default WorkflowSelect;
