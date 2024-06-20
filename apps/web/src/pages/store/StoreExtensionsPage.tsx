import { ExtensionDetailIcon } from '@/components/extension/ExtensionDetail';
import {
  ExtensionCategories,
  ExtensionStoreListItem,
} from '@/interface/extension.interface';
import APIService from '@/services/api.service';
import { StoreQueryOptions } from '@/services/api/api-store.namespace';
import {
  UiAvatar,
  UiAvatarFallback,
  UiAvatarImage,
  UiButton,
  UiCard,
  UiCardContent,
  UiCardFooter,
  UiCardHeader,
  UiSkeleton,
} from '@alt-dot/ui';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { CpuIcon, DownloadIcon, StoreIcon, UserRoundIcon } from 'lucide-react';
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

const numberFormatter = new Intl.NumberFormat();

function ExtensionCard({ extension }: { extension: ExtensionStoreListItem }) {
  return (
    <UiCard className="flex flex-col">
      <UiCardHeader className="flex-row space-y-0 flex-1 items-center p-4 justify-between">
        <ExtensionDetailIcon
          imageClass="h-full w-full size-12 rounded-md object-cover object-center border"
          icon={extension.iconUrl}
          iconUrl={extension.iconUrl}
          title={`${extension.title} icon`}
        />
        <UiButton variant="secondary">Install</UiButton>
      </UiCardHeader>
      <UiCardContent className="p-4 pt-0">
        <Link to={`${extension.id}/${extension.name}`}>
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
            <UiAvatar className="size-5 inline-block align-middle">
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
        <span title="Command counts" className="hidden md:block flex-shrink-0">
          <CpuIcon className="size-5 inline-block align-middle" />
          <span className="ml-1 align-middle">{extension.commands.length}</span>
        </span>
        <span title="Download counts" className="ml-2 lg:ml-3 flex-shrink-0">
          <DownloadIcon className="size-5 align-middle inline-block" />
          <span className="ml-1 align-middle">
            {numberFormatter.format(extension.downloadCount * 1000)}
          </span>
        </span>
      </UiCardFooter>
    </UiCard>
  );
}

function StoreExtensionsPage() {
  const [searchParams] = useSearchParams();
  const [page, setPage] = useState(1);

  const query = useQuery({
    refetchOnMount: false,
    refetchInterval: false,
    refetchOnWindowFocus: false,
    queryKey: [
      'store-extensions',
      {
        q: searchParams.get('q'),
        sortBy: searchParams.get('sortBy'),
        category: searchParams.get('category'),
      },
      page,
    ],
    placeholderData: keepPreviousData,
    queryFn: () =>
      APIService.instance.store.listExtensions({
        q: searchParams.get('q') ?? undefined,
        category: searchParams.get('category') as ExtensionCategories,
        sortBy:
          (searchParams.get('sortBy') as StoreQueryOptions['sortBy']) ??
          undefined,
      }),
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
          {query.data.items.length === 0 && (
            <p className="text-center col-span-full py-4 text-muted-foreground">
              No data
            </p>
          )}
          {query.data.items.map((extension) => (
            <ExtensionCard extension={extension} key={extension.id} />
          ))}
        </>
      )}
    </div>
  );
}

export default StoreExtensionsPage;
