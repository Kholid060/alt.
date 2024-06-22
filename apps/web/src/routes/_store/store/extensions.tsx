import { ExtensionDetailIcon } from '@/components/extension/ExtensionDetail';
import { useNativeApp } from '@/hooks/useNativeApp';
import { ExtensionStoreListItem } from '@/interface/extension.interface';
import APIService from '@/services/api.service';
import { StoreQueryValidation } from '@/validation/store-query.validation';
import {
  UiSkeleton,
  UiButton,
  UiAvatar,
  UiAvatarFallback,
  UiAvatarImage,
  UiCard,
  UiCardContent,
  UiCardFooter,
  UiCardHeader,
  UiButtonLoader,
} from '@alt-dot/ui';
import {
  infiniteQueryOptions,
  keepPreviousData,
  useInfiniteQuery,
} from '@tanstack/react-query';
import { Link, createFileRoute } from '@tanstack/react-router';
import {
  CpuIcon,
  DownloadIcon,
  ShareIcon,
  StoreIcon,
  UserRoundIcon,
} from 'lucide-react';
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

const numberFormatter = new Intl.NumberFormat();
function ExtensionCard({ extension }: { extension: ExtensionStoreListItem }) {
  const { installExtension } = useNativeApp();

  return (
    <UiCard className="flex flex-col">
      <UiCardHeader className="flex-row space-y-0 flex-1 items-center p-4 justify-between">
        <ExtensionDetailIcon
          imageClass="size-10 aspect-square rounded-md object-cover object-center"
          icon={extension.iconUrl}
          iconUrl={extension.iconUrl}
          title={`${extension.title} icon`}
        />
        <button
          className="md:hidden"
          onClick={() =>
            navigator.share({ url: `${extension.name}/${extension.id}` })
          }
        >
          <ShareIcon className="size-5" />
        </button>
        <UiButton
          variant="secondary"
          className="hidden md:inline-block"
          onClick={() => installExtension(extension.id)}
        >
          Install
        </UiButton>
      </UiCardHeader>
      <UiCardContent className="p-4 pt-0">
        <Link to={`${extension.name}/${extension.id}`}>
          <p className="font-semibold line-clamp-1">{extension.title}</p>
          <p className="text-muted-foreground leading-tight line-clamp-2 text-sm">
            {extension.description}
          </p>
        </Link>
      </UiCardContent>
      <UiCardFooter className="items-end p-4 pt-0 text-sm text-muted-foreground">
        <div className="flex-grow">
          <Link
            to={`/u/${extension.owner.username}`}
            className="hover:text-foreground transition-colors line-clamp-1"
          >
            <UiAvatar className="size-4 inline-block align-middle">
              {extension.owner.avatarUrl && (
                <UiAvatarImage src={extension.owner.avatarUrl} />
              )}
              <UiAvatarFallback>
                <UserRoundIcon className="size-4" />
              </UiAvatarFallback>
            </UiAvatar>
            <span className="align-middle ml-1.5">{extension.owner.name}</span>
          </Link>
        </div>
        <span title="Commands count" className="hidden md:block flex-shrink-0">
          <CpuIcon className="size-5 inline-block align-middle" />
          <span className="ml-1 align-middle">{extension.commands.length}</span>
        </span>
        <span title="Downloads count" className="ml-2 lg:ml-3 flex-shrink-0">
          <DownloadIcon className="size-5 align-middle inline-block" />
          <span className="ml-1 align-middle">
            {numberFormatter.format(extension.downloadCount)}
          </span>
        </span>
      </UiCardFooter>
    </UiCard>
  );
}

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
          {query.data.pages.map((group, index) => (
            <Fragment key={index}>
              {group.items.map((extension) => (
                <ExtensionCard extension={extension} key={extension.id} />
              ))}
            </Fragment>
          ))}
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
