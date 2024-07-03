import StoreListItems from '@/components/store/StoreListItems';
import WorkflowIcon from '@/components/workflow/WorkflowIcon';
import { useNativeApp } from '@/hooks/useNativeApp';
import APIService from '@/services/api.service';
import { StoreQueryValidation } from '@/validation/store-query.validation';
import { ApiWorkflowStoreListItem } from '@alt-dot/shared';
import {
  UiButton,
  UiAvatar,
  UiAvatarFallback,
  UiAvatarImage,
  UiCard,
  UiCardContent,
  UiCardFooter,
  UiCardHeader,
} from '@alt-dot/ui';
import {
  infiniteQueryOptions,
  keepPreviousData,
  useInfiniteQuery,
} from '@tanstack/react-query';
import { Link, createFileRoute } from '@tanstack/react-router';
import { DownloadIcon, ShareIcon, UserRoundIcon } from 'lucide-react';
import { Fragment } from 'react/jsx-runtime';

function queryData(search: StoreQueryValidation) {
  return infiniteQueryOptions<
    Awaited<ReturnType<typeof APIService.instance.store.listWorkflows>>
  >({
    initialPageParam: null,
    queryKey: ['store-workflows', search],
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    queryFn: ({ pageParam }) =>
      APIService.instance.store.listWorkflows({
        ...search,
        nextCursor: (pageParam as string) ?? undefined,
      }),
  });
}

export const Route = createFileRoute('/_store/store/workflows')({
  loaderDeps: ({ search }) => search,
  async loader({ context, deps }) {
    await context.queryClient.prefetchInfiniteQuery(queryData(deps));
  },
  staleTime: Infinity,
  component: StoreWorkflowsPage,
});

const numberFormatter = new Intl.NumberFormat();
function WorkflowCard({ workflow }: { workflow: ApiWorkflowStoreListItem }) {
  const { installWorkflow } = useNativeApp();

  return (
    <UiCard className="flex flex-col">
      <UiCardHeader className="flex-row space-y-0 flex-1 items-center p-4 justify-between">
        <WorkflowIcon icon={workflow.icon} />
        <button
          className="md:hidden"
          onClick={() => navigator.share({ url: `${workflow.id}` })}
        >
          <ShareIcon className="size-5" />
        </button>
        <UiButton
          variant="secondary"
          className="hidden md:inline-block"
          onClick={() => installWorkflow(workflow.id)}
        >
          Install
        </UiButton>
      </UiCardHeader>
      <UiCardContent className="p-4 pt-0">
        <Link to={`${workflow.id}`}>
          <p className="font-semibold line-clamp-1">{workflow.name}</p>
          <p className="text-muted-foreground leading-tight line-clamp-2 text-sm">
            {workflow.description}
          </p>
        </Link>
      </UiCardContent>
      <UiCardFooter className="items-end p-4 pt-0 text-sm text-muted-foreground">
        <div className="flex-grow">
          <Link
            to={`/u/${workflow.owner.username}`}
            className="hover:text-foreground transition-colors line-clamp-1"
          >
            <UiAvatar className="size-4 inline-block align-middle">
              {workflow.owner.avatarUrl && (
                <UiAvatarImage loading="lazy" src={workflow.owner.avatarUrl} />
              )}
              <UiAvatarFallback>
                <UserRoundIcon className="size-4" />
              </UiAvatarFallback>
            </UiAvatar>
            <span className="align-middle ml-1.5">{workflow.owner.name}</span>
          </Link>
        </div>
        <span title="Downloads count" className="ml-2 lg:ml-3 flex-shrink-0">
          <DownloadIcon className="size-5 align-middle inline-block" />
          <span className="ml-1 align-middle">
            {numberFormatter.format(workflow.downloadCount)}
          </span>
        </span>
      </UiCardFooter>
    </UiCard>
  );
}

function StoreWorkflowsPage() {
  const searchParams = Route.useSearch();

  const query = useInfiniteQuery({
    refetchOnMount: false,
    refetchInterval: false,
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
    ...queryData(searchParams),
  });

  return (
    <StoreListItems
      query={query}
      renderList={(items) =>
        items.pages.map((group, index) => (
          <Fragment key={index}>
            {group.items.map((workflow) => (
              <WorkflowCard key={workflow.id} workflow={workflow} />
            ))}
          </Fragment>
        ))
      }
    />
  );
}
