import StoreListItems from '@/components/store/StoreListItems';
import WorkflowStoreCard from '@/components/workflow/WorkflowStoreCard';
import APIService from '@/services/api.service';
import {
  infiniteQueryOptions,
  useInfiniteQuery,
  keepPreviousData,
} from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { Fragment } from 'react/jsx-runtime';

function queryData(username: string, nextCursor?: string) {
  return infiniteQueryOptions<
    Awaited<ReturnType<typeof APIService.instance.user.listWorkflows>>
  >({
    initialPageParam: null,
    queryKey: ['user-workflows', username, nextCursor],
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    queryFn: () => APIService.instance.user.listWorkflows(username, nextCursor),
  });
}

export const Route = createFileRoute('/u/$username/workflows')({
  async loader({ context, params }) {
    await context.queryClient.prefetchInfiniteQuery(queryData(params.username));
  },
  staleTime: Infinity,
  component: UserWorkflows,
});

function UserWorkflows() {
  const params = Route.useParams();

  const query = useInfiniteQuery({
    refetchOnMount: false,
    refetchInterval: false,
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
    ...queryData(params.username),
  });

  return (
    <StoreListItems
      query={query}
      renderList={(items) =>
        items.pages.map((group, index) => (
          <Fragment key={index}>
            {group.items.map((workflow) => (
              <WorkflowStoreCard
                key={workflow.id}
                disabledOwnerLink
                workflow={workflow}
              />
            ))}
          </Fragment>
        ))
      }
    />
  );
}
