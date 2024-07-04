import ExtensionStoreCard from '@/components/extension/ExtensionStoreCard';
import StoreListItems from '@/components/store/StoreListItems';
import APIService from '@/services/api.service';
import { StoreQueryValidation } from '@/validation/store-query.validation';
import {
  infiniteQueryOptions,
  keepPreviousData,
  useInfiniteQuery,
} from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { Fragment } from 'react';

function queryData(search: StoreQueryValidation) {
  return infiniteQueryOptions<
    Awaited<ReturnType<typeof APIService.instance.store.listExtensions>>
  >({
    initialPageParam: null,
    queryKey: ['store-extensions', search],
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    queryFn: ({ pageParam }) =>
      APIService.instance.store.listExtensions({
        ...search,
        nextCursor: (pageParam as string) ?? undefined,
      }),
  });
}

export const Route = createFileRoute('/_store/store/extensions')({
  loaderDeps: ({ search }) => search,
  async loader({ context, deps }) {
    await context.queryClient.prefetchInfiniteQuery(queryData(deps));
  },
  staleTime: Infinity,
  component: StoreExtensionsPage,
});

function StoreExtensionsPage() {
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
            {group.items.map((extension) => (
              <ExtensionStoreCard extension={extension} key={extension.id} />
            ))}
          </Fragment>
        ))
      }
    />
  );
}
