import ExtensionStoreCard from '@/components/extension/ExtensionStoreCard';
import StoreListItems from '@/components/store/StoreListItems';
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
    Awaited<ReturnType<typeof APIService.instance.user.listExtensions>>
  >({
    initialPageParam: null,
    queryKey: ['user-extensions', username, nextCursor],
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    queryFn: () =>
      APIService.instance.user.listExtensions(username, nextCursor),
  });
}

export const Route = createFileRoute('/u/$username/extensions')({
  async loader({ context, params }) {
    await context.queryClient.prefetchInfiniteQuery(queryData(params.username));
  },
  staleTime: Infinity,
  component: UserExtensions,
});

function UserExtensions() {
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
            {group.items.map((extension) => (
              <ExtensionStoreCard
                disabledOwnerLink
                key={extension.id}
                extension={extension}
              />
            ))}
          </Fragment>
        ))
      }
    />
  );
}
