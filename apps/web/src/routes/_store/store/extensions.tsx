import ExtensionStoreCard from '@/components/extension/ExtensionStoreCard';
import StoreListItems from '@/components/store/StoreListItems';
import { storeExtensionQuery } from '@/utils/queries/store';
import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { Fragment } from 'react';

export const Route = createFileRoute('/_store/store/extensions')({
  loaderDeps: ({ search }) => search,
  async loader({ context, deps }) {
    await context.queryClient.prefetchInfiniteQuery(storeExtensionQuery(deps));
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
    ...storeExtensionQuery(searchParams),
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
