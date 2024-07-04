import { useCommandNavigate, useCommandRoute } from '/@/hooks/useCommandRoute';
import { useCommandPanelHeader } from '/@/hooks/useCommandPanelHeader';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import bugFixingSvg from '/@/assets/svg/bug-fixing.svg';
import {
  UiAvatar,
  UiAvatarFallback,
  UiAvatarImage,
  UiButtonLoader,
  UiList,
  UiSkeleton,
  UiTooltip,
} from '@alt-dot/ui';
import WorkflowIcon from '/@/components/workflow/WorkflowIcon';
import {
  DownloadIcon,
  ExternalLinkIcon,
  Loader2Icon,
  LucideWorkflow,
  TriangleAlertIcon,
  UserRoundIcon,
} from 'lucide-react';
import { useState } from 'react';
import preloadAPI from '/@/utils/preloadAPI';
import UiExtensionIcon from '/@/components/ui/UiExtensionIcon';
import { useCommandPanelStore } from '/@/stores/command-panel.store';
import { ApiExtensionHighlightItem } from '@alt-dot/shared';
import { isIPCEventError } from '#packages/common/utils/helper';
import { WorkflowApiWithExtensions } from '#packages/main/src/workflow/workflow.interface';
import { WorkflowNodes } from '@alt-dot/workflow';

const numberFormatter = new Intl.NumberFormat();

function RouteWorkflowInstall() {
  const queryClient = useQueryClient();
  const workflowId = useCommandRoute(
    (state) => state.currentRoute.params.workflowId!,
  );
  const addPanelStatus = useCommandPanelStore.use.addStatus();

  const navigate = useCommandNavigate();

  const [isAdding, setIsAdding] = useState(false);
  const [installingExts, setInstallingExts] = useState<string[]>([]);

  useCommandPanelHeader({
    icon: <LucideWorkflow className="size-5 mr-2" />,
    title: 'Add workflow',
  });
  const query = useQuery({
    refetchOnMount: false,
    refetchInterval: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    queryKey: ['store-workflows', workflowId],
    queryFn: () =>
      preloadAPI.main.ipc.invokeWithError(
        'workflow:get-with-extensions',
        workflowId,
      ),
  });

  async function addWorkflow() {
    try {
      const { workflow } = query.data ?? {};
      if (!workflow) return;

      setIsAdding(true);

      const result = await preloadAPI.main.ipc.invoke(
        'database:insert-workflow',
        {
          icon: workflow.icon,
          name: workflow.name,
          edges: workflow.workflow.edges,
          description: workflow.description,
          viewport: workflow.workflow.viewport,
          variables: workflow.workflow.variables,
          nodes: workflow.workflow.nodes as WorkflowNodes[],
        },
      );
      if (isIPCEventError(result)) {
        addPanelStatus({
          type: 'error',
          description: result.message,
          title: 'Error when adding workflow',
        });
        return;
      }

      navigate('');

      queryClient.setQueryData(['store-workflows', workflowId], undefined);

      await preloadAPI.main.ipc.invoke('command-window:close');
      preloadAPI.main.ipc.send('dashboard-window:open', `/workflows/${result}`);
    } catch (error) {
      console.error(error);
      addPanelStatus({
        type: 'error',
        title: 'Something went wrong when adding workflow',
      });
    } finally {
      setIsAdding(false);
    }
  }
  async function installExtension(extension: ApiExtensionHighlightItem) {
    try {
      if (installingExts.includes(extension.id) || !query.data) return;

      setInstallingExts([...installingExts, extension.id]);

      const result = await preloadAPI.main.ipc.invoke(
        'extension:install',
        extension.id,
      );
      if (isIPCEventError(result)) {
        addPanelStatus({
          type: 'error',
          description: result.message,
          title: `Error when installing "${extension.title}" extension`,
        });
        return;
      }

      queryClient.setQueryData(['store-workflows', workflowId], {
        ...query.data,
        missingExtensions: query.data.missingExtensions.filter(
          (item) => item.id !== extension.id,
        ),
      } as WorkflowApiWithExtensions);

      setInstallingExts(
        installingExts.filter((extId) => extId !== extension.id),
      );
    } catch (error) {
      console.error(error);
      addPanelStatus({
        type: 'error',
        title: `Error when installing "${extension.title}" extension`,
      });
      setInstallingExts(
        installingExts.filter((extId) => extId !== extension.id),
      );
    }
  }

  return (
    <div className="py-4 px-5">
      {query.isPending ? (
        <>
          <div className="flex items-center">
            <UiSkeleton className="h-[82px] w-[82px] rounded-lg" />
            <div className="ml-4 flex-grow">
              <UiSkeleton className="h-8 w-44" />
              <UiSkeleton className="h-3 w-52 mt-2" />
              <UiSkeleton className="h-3 w-28 mt-4" />
            </div>
          </div>
          <div className="flex items-center mt-10 gap-4">
            <UiSkeleton className="h-4 w-24" />
            <UiSkeleton className="h-4 w-24" />
            <UiSkeleton className="h-4 w-24" />
            <div className="flex-grow"></div>
            <UiSkeleton className="h-10 w-40" />
          </div>
        </>
      ) : query.isError ? (
        <div className="flex flex-col items-center">
          <img src={bugFixingSvg} className="w-40" alt="error" />
          <p className="mb-6 font-semibold">Couldn&apos;t find workflow</p>
        </div>
      ) : (
        <>
          <div className="flex items-center">
            <div className="p-2 rounded-md border bg-card border-border/40 text-muted-foreground inline-block">
              <WorkflowIcon
                className="size-12"
                icon={query.data.workflow.icon}
              />
            </div>
            <div className="flex-grow ml-4">
              <p className="font-semibold leading-tight text-lg">
                {query.data.workflow.name}
              </p>
              <p className="text-muted-foreground leading-tight line-clamp-2 text-sm">
                {query.data.workflow.description}
              </p>
              <p className="text-sm mt-1 text-muted-foreground">
                <UiAvatar className="size-4 inline-block align-middle">
                  {query.data.workflow.owner.avatarUrl && (
                    <UiAvatarImage
                      loading="lazy"
                      src={query.data.workflow.owner.avatarUrl}
                    />
                  )}
                  <UiAvatarFallback>
                    <UserRoundIcon className="size-4" />
                  </UiAvatarFallback>
                </UiAvatar>
                <span className="align-middle ml-1.5">
                  {query.data.workflow.owner.name}
                </span>
              </p>
            </div>
          </div>
          {query.data.missingExtensions.length > 0 && (
            <div className="mt-6">
              <div className="text-orange-500 text-sm">
                <TriangleAlertIcon className="size-4 inline align-middle" />{' '}
                <span className="align-middle">
                  {query.data.missingExtensions.length} missing extensions
                </span>
              </div>
              <div className="grid grid-cols-2 text-sm mt-2 gap-2">
                {query.data.missingExtensions.map((extension) => (
                  <div
                    key={extension.id}
                    className="flex items-center p-2 hover:bg-card rounded-md group/card"
                  >
                    <div className="h-8 w-8">
                      <UiExtensionIcon
                        extensionIcon
                        id={extension.id}
                        icon={extension.iconUrl}
                        alt={`${extension.title} icon`}
                        iconWrapper={(Icon) => <UiList.Icon icon={Icon} />}
                      />
                    </div>
                    <div className="ml-2 flex-1">
                      <p className="leading-tight line-clamp-1">
                        {extension.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        by {extension.owner.name}
                      </p>
                    </div>
                    <UiTooltip label="Open store page">
                      <a
                        href={`${import.meta.env.VITE_WEB_BASE_URL}/store/extensions/${extension.name}/${extension.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="invisible group-hover/card:visible"
                      >
                        <ExternalLinkIcon className="text-muted-foreground size-5" />
                      </a>
                    </UiTooltip>
                    {installingExts.includes(extension.id) ? (
                      <Loader2Icon className="size-5 animate-spin" />
                    ) : (
                      <UiTooltip label="Install extension">
                        <button
                          className="ml-3"
                          onClick={() => installExtension(extension)}
                        >
                          <DownloadIcon className="size-5" />
                        </button>
                      </UiTooltip>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="flex items-center mt-9 text-muted-foreground text-sm">
            <span>
              <DownloadIcon className="size-5 inline align-middle" />
              <span className="align-middle ml-1">
                {numberFormatter.format(query.data.workflow.downloadCount)}x
              </span>
            </span>
            <div className="flex-grow"></div>
            <UiButtonLoader
              isLoading={isAdding}
              className="min-w-40"
              onClick={addWorkflow}
            >
              Add workflow
            </UiButtonLoader>
          </div>
        </>
      )}
    </div>
  );
}

export default RouteWorkflowInstall;
