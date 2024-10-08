import StoreListItems from '@/components/store/StoreListItems';
import WorkflowStoreCard from '@/components/workflow/WorkflowStoreCard';
import APIService from '@/services/api.service';
import { StoreQueryValidation } from '@/validation/store-query.validation';
import {
  infiniteQueryOptions,
  keepPreviousData,
  useInfiniteQuery,
} from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
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
              <WorkflowStoreCard key={workflow.id} workflow={workflow} />
            ))}
          </Fragment>
        ))
      }
    />
  );
}
