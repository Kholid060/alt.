import { UiSkeleton, UiButton, UiButtonLoader } from '@alt-dot/ui';
import { InfiniteData, UseInfiniteQueryResult } from '@tanstack/react-query';
import { StoreIcon } from 'lucide-react';

function StoreListItems<
  T extends UseInfiniteQueryResult<InfiniteData<unknown>>,
>({
  query,
  renderList,
}: {
  query: T;
  renderList: (items: NonNullable<T['data']>) => React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {query.isPending ? (
        <>
          <UiSkeleton className="h-36" />
          <UiSkeleton className="h-36" />
          <UiSkeleton className="h-36" />
          <UiSkeleton className="h-36" />
        </>
      ) : query.isError ? (
        <div className="flex flex-col place-items-center mt-12 max-w-md mx-auto text-center col-span-full">
          <div className="inline-block rounded-full bg-card/60 p-6 text-muted-foreground">
            <StoreIcon className="size-10" />
          </div>
          <h2 className="font-semibold mt-4 text-lg">
            Couldn&apos;t fetch items
          </h2>
          <p className="mt-1 leading-tight text-muted-foreground">
            Something went wrong when trying to fetch the items
          </p>
          <UiButton
            className="mt-8 min-w-40"
            variant="secondary"
            onClick={() => query.refetch()}
          >
            Try again
          </UiButton>
        </div>
      ) : (
        <>
          {renderList(query.data)}
          {query.data.pages.length === 0 && (
            <p className="text-center col-span-full py-4 text-muted-foreground">
              No data
            </p>
          )}
          {query.hasNextPage && (
            <div className="col-span-full pt-4 text-center">
              <UiButtonLoader
                isLoading={query.isFetching || query.isFetchingNextPage}
                onClick={() => query.fetchNextPage()}
                className="min-w-40"
              >
                Load more
              </UiButtonLoader>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default StoreListItems;
