import UiMarkdown from '@/components/ui/UiMarkdown';
import WorkflowIcon from '@/components/workflow/WorkflowIcon';
import WorkflowViewer from '@/components/workflow/WorkflowViewer';
import { useNativeApp } from '@/hooks/useNativeApp';
import dayjs from '@/lib/dayjs';
import APIService from '@/services/api.service';
import { ApiWorkflowDetail } from '@alt-dot/shared';
import {
  UiAvatar,
  UiAvatarFallback,
  UiAvatarImage,
  UiButton,
  UiDropdownMenu,
  UiDropdownMenuContent,
  UiDropdownMenuItem,
  UiDropdownMenuTrigger,
  UiSkeleton,
} from '@alt-dot/ui';
import { queryOptions } from '@tanstack/react-query';
import { Link, createFileRoute } from '@tanstack/react-router';
import { UserRoundIcon, ShareIcon, ChevronDownIcon } from 'lucide-react';

const queryData = (workflowId: string) =>
  queryOptions({
    queryKey: ['store-workflows:detail', workflowId],
    queryFn: () => APIService.instance.store.getWorkflow(workflowId),
  });

export const Route = createFileRoute('/store/workflows/$workflowId')({
  component: StoreWorkflowDetailPage,
  pendingComponent: () => (
    <div className="container pt-36">
      <div className="md:flex md:items-center">
        <UiSkeleton className="size-16" />
        <div className="md:flex-grow md:ml-4 mt-4 md:mt-0">
          <UiSkeleton className="w-48 h-7" />
          <UiSkeleton className="w-24 h-5 mt-2" />
        </div>
        <div className="w-full max-w-md md:w-auto flex items-center mt-4 md:mt-0">
          <UiSkeleton className="h-10 w-24 flex-grow md:flex-auto" />
          <UiSkeleton className="size-10 ml-2" />
        </div>
      </div>
      <UiSkeleton className="h-[400px] my-8" />
      <div className="lg:flex lg:items-start lg:flex-row">
        <UiSkeleton className="h-96 flex-1" />
        <UiSkeleton className="w-72 mt-4 lg:mt-0 lg:ml-12 h-52" />
      </div>
    </div>
  ),
  async loader({ params, context }) {
    const result = await context.queryClient.ensureQueryData(
      queryData(params.workflowId),
    );

    return result;
  },
});

function WorkflowPageHeader({ workflow }: { workflow: ApiWorkflowDetail }) {
  const { installWorkflow } = useNativeApp();

  function downloadAsJSON() {
    const workflowData = {
      name: workflow.name,
      icon: workflow.icon,
      nodes: workflow.workflow.nodes,
      edges: workflow.workflow.edges,
      description: workflow.description,
      variables: workflow.workflow.variables ?? [],
    };
    const objectUrl = URL.createObjectURL(
      new Blob([JSON.stringify(workflowData)]),
    );

    const anchorEl = document.createElement('a');
    anchorEl.href = objectUrl;
    anchorEl.download = `${workflow.name}.json`;

    document.body.appendChild(anchorEl);
    anchorEl.click();

    URL.revokeObjectURL(objectUrl);
  }

  return (
    <div className="flex items-start md:items-center flex-col md:flex-row">
      <WorkflowIcon svgClass="size-16" className="p-1" icon={workflow.icon} />
      <div className="flex-grow mt-2 md:mt-0 md:ml-4 md:mr-4">
        <h3 className="text-lg font-semibold">{workflow.name}</h3>
        <p className="text-muted-foreground text-sm line-clamp-2">
          {workflow.description}
        </p>
        <div className="mt-2">
          <Link
            to={`/u/${workflow.owner.username}`}
            className="hover:text-foreground transition-colors line-clamp-1 text-muted-foreground text-sm inline"
          >
            <UiAvatar className="size-4 inline-block align-middle">
              {workflow.owner.avatarUrl && (
                <UiAvatarImage src={workflow.owner.avatarUrl} />
              )}
              <UiAvatarFallback>
                <UserRoundIcon className="size-4" />
              </UiAvatarFallback>
            </UiAvatar>
            <span className="align-middle ml-1.5">{workflow.owner.name}</span>
          </Link>
        </div>
      </div>
      <div className="flex items-center w-full max-w-md md:w-auto mt-4">
        <div className="flex-1 md:flex-auto">
          <UiButton
            className="rounded-r-none align-middle relative"
            onClick={() => installWorkflow(workflow.id)}
          >
            Add workflow
            <hr className="absolute h-7 w-px bg-black/20 right-0" />
          </UiButton>
          <UiDropdownMenu>
            <UiDropdownMenuTrigger asChild>
              <UiButton size="icon" className="rounded-l-none align-middle">
                <ChevronDownIcon className="size-5" />
              </UiButton>
            </UiDropdownMenuTrigger>
            <UiDropdownMenuContent align="end">
              <UiDropdownMenuItem onClick={downloadAsJSON}>
                Download as file
              </UiDropdownMenuItem>
            </UiDropdownMenuContent>
          </UiDropdownMenu>
        </div>
        <UiButton
          size="icon"
          variant="secondary"
          className="ml-2"
          onClick={() => navigator.share({ url: window.location.href })}
        >
          <ShareIcon className="size-5" />
        </UiButton>
      </div>
    </div>
  );
}

const numberFormatter = new Intl.NumberFormat();
function StoreWorkflowDetailPage() {
  const data = Route.useLoaderData();

  return (
    <div className="py-36 container">
      <WorkflowPageHeader workflow={data} />
      <div className="mt-6 h-64 md:h-96 lg:h-[500px] rounded-lg border-2 overflow-hidden border-border/70">
        <WorkflowViewer
          edges={data.workflow.edges}
          nodes={data.workflow.nodes}
        />
      </div>
      <div className="lg:flex lg:items-start mt-12">
        <div className="flex-1">
          <UiMarkdown markdown={data.readme} />
        </div>
        <hr className="my-8 lg:hidden" />
        <div className="lg:w-72 lg:ml-12 text-sm">
          <div className="border rounded-lg p-4 grid grid-cols-2 gap-y-4 gap-x-2 max-w-xs flex-1">
            <p className="text-muted-foreground">Downloads count</p>
            <p className="text-right">
              {numberFormatter.format(data.downloadCount)}x
            </p>
            <p className="text-muted-foreground">Last updated</p>
            <p className="text-right">{dayjs(data.updatedAt).fromNow()}</p>
            <p className="text-muted-foreground">Published</p>
            <p className="text-right">{dayjs(data.createdAt).fromNow()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
