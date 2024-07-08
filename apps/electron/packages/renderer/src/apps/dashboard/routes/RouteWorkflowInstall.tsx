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
} from '@altdot/ui';
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
import { ApiExtensionHighlightItem } from '@altdot/shared';
import { isIPCEventError } from '#packages/common/utils/helper';
import { WorkflowApiWithExtensions } from '#packages/main/src/workflow/workflow.interface';
import { WorkflowNodes } from '@altdot/workflow';

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
    icon: <LucideWorkflow className="mr-2 size-5" />,
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
    <div className="flex min-h-48 flex-col px-5 py-4">
      {query.isPending ? (
        <>
          <div className="flex items-center">
            <UiSkeleton className="h-[82px] w-[82px] rounded-lg" />
            <div className="ml-4 flex-grow">
              <UiSkeleton className="h-8 w-44" />
              <UiSkeleton className="mt-2 h-3 w-52" />
              <UiSkeleton className="mt-4 h-3 w-28" />
            </div>
          </div>
          <div className="mt-10 flex items-center gap-4">
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
            <div className="inline-block rounded-md border border-border/40 bg-card p-2 text-muted-foreground">
              <WorkflowIcon
                className="size-12"
                icon={query.data.workflow.icon}
              />
            </div>
            <div className="ml-4 flex-grow">
              <p className="text-lg font-semibold leading-tight">
                {query.data.workflow.name}
              </p>
              <p className="line-clamp-2 text-sm leading-tight text-muted-foreground">
                {query.data.workflow.description}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                <UiAvatar className="inline-block size-4 align-middle">
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
                <span className="ml-1.5 align-middle">
                  {query.data.workflow.owner.name}
                </span>
              </p>
            </div>
          </div>
          <div className="mt-6 flex-1">
            {query.data.missingExtensions.length > 0 && (
              <>
                <div className="text-sm text-orange-500">
                  <TriangleAlertIcon className="inline size-4 align-middle" />{' '}
                  <span className="align-middle">
                    {query.data.missingExtensions.length} missing extensions
                  </span>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                  {query.data.missingExtensions.map((extension) => (
                    <div
                      key={extension.id}
                      className="group/card flex items-center rounded-md p-2 hover:bg-card"
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
                        <p className="line-clamp-1 leading-tight">
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
                          <ExternalLinkIcon className="size-5 text-muted-foreground" />
                        </a>
                      </UiTooltip>
                      {installingExts.includes(extension.id) ? (
                        <Loader2Icon className="ml-3 size-5 animate-spin" />
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
              </>
            )}
          </div>
          <div className="mt-9 flex items-center text-sm text-muted-foreground">
            <span>
              <DownloadIcon className="inline size-5 align-middle" />
              <span className="ml-1 align-middle">
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
