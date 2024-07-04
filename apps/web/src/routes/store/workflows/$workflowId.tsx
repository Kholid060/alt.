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
        <div className="mt-4 md:ml-4 md:mt-0 md:flex-grow">
          <UiSkeleton className="h-7 w-48" />
          <UiSkeleton className="mt-2 h-5 w-24" />
        </div>
        <div className="mt-4 flex w-full max-w-md items-center md:mt-0 md:w-auto">
          <UiSkeleton className="h-10 w-24 flex-grow md:flex-auto" />
          <UiSkeleton className="ml-2 size-10" />
        </div>
      </div>
      <UiSkeleton className="my-8 h-[400px]" />
      <div className="lg:flex lg:flex-row lg:items-start">
        <UiSkeleton className="h-96 flex-1" />
        <UiSkeleton className="mt-4 h-52 w-72 lg:ml-12 lg:mt-0" />
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
    <div className="flex flex-col items-start md:flex-row md:items-center">
      <WorkflowIcon svgClass="size-16" className="p-1" icon={workflow.icon} />
      <div className="mt-2 flex-grow md:ml-4 md:mr-4 md:mt-0">
        <h3 className="text-lg font-semibold">{workflow.name}</h3>
        <p className="line-clamp-2 text-sm text-muted-foreground">
          {workflow.description}
        </p>
        <div className="mt-2">
          <Link
            to={`/u/${workflow.owner.username}`}
            className="line-clamp-1 inline text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <UiAvatar className="inline-block size-4 align-middle">
              {workflow.owner.avatarUrl && (
                <UiAvatarImage src={workflow.owner.avatarUrl} />
              )}
              <UiAvatarFallback>
                <UserRoundIcon className="size-4" />
              </UiAvatarFallback>
            </UiAvatar>
            <span className="ml-1.5 align-middle">{workflow.owner.name}</span>
          </Link>
        </div>
      </div>
      <div className="mt-4 flex w-full max-w-md items-center md:w-auto">
        <div className="flex-1 md:flex-auto">
          <UiButton
            className="relative rounded-r-none align-middle"
            onClick={() => installWorkflow(workflow.id)}
          >
            Add workflow
            <hr className="absolute right-0 h-7 w-px bg-black/20" />
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
    <div className="container py-36">
      <WorkflowPageHeader workflow={data} />
      <div className="mt-6 h-64 overflow-hidden rounded-lg border-2 border-border/70 md:h-96 lg:h-[500px]">
        <WorkflowViewer
          edges={data.workflow.edges}
          nodes={data.workflow.nodes}
        />
      </div>
      <div className="mt-12 lg:flex lg:items-start">
        <div className="flex-1">
          <UiMarkdown markdown={data.readme} />
        </div>
        <hr className="my-8 lg:hidden" />
        <div className="text-sm lg:ml-12 lg:w-72">
          <div className="grid max-w-xs flex-1 grid-cols-2 gap-x-2 gap-y-4 rounded-lg border p-4">
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
