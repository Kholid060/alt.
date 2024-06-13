import { UiList, UiListItem } from '@alt-dot/ui';
import { useDatabaseQuery } from '/@/hooks/useDatabase';
import { CpuIcon, WorkflowIcon } from 'lucide-react';
import { useCommandPanelHeader } from '/@/hooks/useCommandPanelHeader';
import { useEffect, useState } from 'react';
import preloadAPI from '/@/utils/preloadAPI';
import { isIPCEventError } from '#packages/common/utils/helper';
import { useUiListStore } from '@alt-dot/ui/dist/context/list.context';
import { UiExtIcon } from '@alt-dot/extension';
import { ExtensionCommandProcess } from '#packages/common/interface/extension.interface';
import UiExtensionIcon from '/@/components/ui/UiExtensionIcon';
import { SetRequired } from 'type-fest';
import { useCommandPanelStore } from '/@/stores/command-panel.store';

type UiListItemProcess = SetRequired<
  UiListItem<'command' | 'workflow'>,
  'metadata'
>;

function RunningProcess() {
  useCommandPanelHeader({
    title: 'Running Process',
    icon: <CpuIcon className="h-5 w-5 mr-2" />,
  });

  const uiListStore = useUiListStore();
  const setPanelStatus = useCommandPanelStore.use.addStatus();

  const workflowQuery = useDatabaseQuery('database:get-running-workflows', [], {
    transform(data): UiListItemProcess[] {
      if (!data) return [];

      return data.map((item) => ({
        group: 'Workflows',
        metadata: 'workflow',
        value: item.runnerId,
        title: item.workflow.name,
        icon: (
          <UiList.Icon
            icon={
              UiExtIcon[item.workflow.icon as keyof typeof UiExtIcon] ??
              WorkflowIcon
            }
          />
        ),
      }));
    },
  });

  const [runningCommands, setRunningCommands] = useState<UiListItemProcess[]>(
    [],
  );

  async function onItemSelected(value: string) {
    const item =
      runningCommands.find((item) => item.value === value) ||
      workflowQuery.data?.find((item) => item.value === value);
    if (!item) return;

    try {
      let result: unknown;

      if (item.metadata === 'command') {
        result = await preloadAPI.main.ipc.invoke(
          'extension:stop-running-command',
          value,
        );
      } else {
        result = await preloadAPI.main.ipc.invoke(
          'workflow:stop-running',
          value,
        );
      }

      if (isIPCEventError(result)) {
        setPanelStatus({
          type: 'error',
          title: 'Error!',
          description: result.message,
        });
      }
    } catch (error) {
      console.error(error);
      setPanelStatus({
        type: 'error',
        title: 'Something went wrong',
      });
    }
  }

  useEffect(() => {
    uiListStore.setState('search', '');

    const setCommands = (items: ExtensionCommandProcess[]) => {
      setRunningCommands(
        items.map((item) => ({
          title: item.title,
          group: 'Extensions',
          value: item.runnerId,
          metadata: 'command',
          icon: (
            <UiExtensionIcon
              alt={item.title}
              id={item.extensionId}
              icon={item.icon}
              iconWrapper={(icon) => <UiList.Icon icon={icon} />}
            />
          ),
          subtitle: item.extensionTitle,
        })),
      );
    };

    preloadAPI.main.ipc
      .invoke('extension:list-running-commands')
      .then((result) => {
        if (isIPCEventError(result)) return;
        setCommands(result);
      });

    const offRunningExtChanges = preloadAPI.main.ipc.on(
      'extension:running-commands-change',
      (_, items) => {
        setCommands(items);
      },
    );

    return () => {
      offRunningExtChanges();
    };
  }, []);

  return (
    <UiList
      className="p-2"
      items={[...runningCommands, ...(workflowQuery.data ?? [])]}
      noDataSlot={
        <p className="text-center text-sm text-muted-foreground my-4">
          No running process
        </p>
      }
      onItemSelected={onItemSelected}
    />
  );
}

export default RunningProcess;
