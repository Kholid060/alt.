import { Extension } from '@/interface/extension.interface';
import { afetch } from '@altdot/shared';
import {
  UiButton,
  UiIcons,
  UiImage,
  UiInput,
  UiLabel,
  UiSkeleton,
} from '@altdot/ui';
import { useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import { ExternalLinkIcon, FileIcon } from 'lucide-react';
import UiMarkdown from '../ui/UiMarkdown';
import { EXTENSION_COMMAND_TYPE_NAME } from '@/utils/constant';

export function ExtensionDetailIcon({
  icon,
  title,
  iconUrl,
  svgClass,
  className,
  imageClass,
}: {
  icon: string;
  title: string;
  iconUrl: string;
  svgClass?: string;
  className?: string;
  imageClass?: string;
}) {
  if (icon.startsWith('icon:')) {
    const Icon =
      UiIcons[icon.split(':')[1] as keyof typeof UiIcons] ?? UiIcons.Command;

    return (
      <div className="inline-block rounded-md border border-border/40 bg-card p-2 text-muted-foreground">
        <Icon className={clsx(svgClass, className)} />
      </div>
    );
  }

  return (
    <UiImage
      src={iconUrl}
      className={clsx(imageClass)}
      alt={`${title} icon`}
      loading="lazy"
    />
  );
}

export function ExtensionDetailHeader({
  icon,
  title,
  iconUrl,
  version,
  className,
  suffixSlot,
  description,
  ...props
}: {
  icon: string;
  title: string;
  iconUrl: string;
  version: string;
  description: string;
  suffixSlot?: React.ReactNode;
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={clsx('items-center md:flex', className)} {...props}>
      <ExtensionDetailIcon
        icon={icon}
        title={title}
        iconUrl={iconUrl}
        svgClass="size-11"
        imageClass="size-12"
      />
      <div className="flex-grow md:ml-4">
        <h2 className="cursor-default text-2xl font-semibold leading-tight">
          {title}
        </h2>
        <p className="line-clamp-1 text-sm leading-tight text-muted-foreground">
          v{version} • {description}
        </p>
      </div>
      {suffixSlot}
    </div>
  );
}

export const MAX_ASSET_FETCH_RETRY = 3;
export function ExtensionDetailMarkdownAsset({
  assetUrl,
  filename,
}: {
  assetUrl: string;
  filename: string;
}) {
  const query = useQuery({
    refetchOnMount: false,
    refetchInterval: false,
    retry(failureCount, error) {
      if ('status' in error && error.status === 404) return false;

      return failureCount <= MAX_ASSET_FETCH_RETRY;
    },
    queryKey: ['ext-assets', filename, assetUrl],
    queryFn: () =>
      afetch<string>(assetUrl, {
        responseType: 'text',
        headers: { 'Content-Type': 'text/plain' },
      }),
  });

  if (query.isLoading || query.isPending) {
    return (
      <div className="mt-4 space-y-2">
        <UiSkeleton className="h-12 w-full rounded-md" />
        <UiSkeleton className="h-6 w-full rounded-sm" />
        <UiSkeleton className="h-6 w-full rounded-sm" />
        <UiSkeleton className="h-6 w-full rounded-sm" />
        <UiSkeleton className="h-6 w-full rounded-sm" />
      </div>
    );
  }

  if (query.isError) {
    const isNotFound = 'status' in query.error && query.error.status === 404;

    return isNotFound ? null : (
      <div className="mx-auto mt-12 flex max-w-md flex-col place-items-center text-center">
        <div className="inline-block rounded-full bg-card/60 p-6 text-muted-foreground">
          <FileIcon className="size-10" />
        </div>
        <h2 className="mt-4 text-lg font-semibold">
          Couldn&apos;t {isNotFound ? 'find' : 'load'} {filename} file
        </h2>
        {!isNotFound && (
          <p className="mt-1 leading-tight text-muted-foreground">
            Something went wrong when trying to fetch the {filename} file
          </p>
        )}
        <UiButton
          className="mt-8 min-w-40"
          variant="secondary"
          onClick={() => query.refetch()}
        >
          Try again
        </UiButton>
      </div>
    );
  }

  return <UiMarkdown markdown={query.data ?? ''} />;
}

export function ExtensionDetail({
  banners,
  commands,
  sourceUrl,
  categories,
  loadingBanners,
}: Pick<Extension, 'categories' | 'banners' | 'sourceUrl' | 'commands'> & {
  loadingBanners?: boolean;
}) {
  return (
    <div className="grid max-w-3xl grid-cols-1 items-start gap-x-4 gap-y-2 md:grid-cols-12 md:gap-y-8">
      <div className="col-span-5 leading-none">
        <UiLabel htmlFor="extension-repo-url">Extension repository URL</UiLabel>
      </div>
      <UiInput
        readOnly
        value={sourceUrl}
        id="extension-repo-url"
        wrapperClass="col-span-7"
        suffixIcon={
          <a href={sourceUrl} target="_blank" rel="noreferrer">
            <ExternalLinkIcon className="size-5" />
          </a>
        }
        onClick={(event) => (event.target as HTMLInputElement).select()}
      />
      <div className="col-span-5 mt-4 leading-none md:mt-0">
        <UiLabel>Banner images</UiLabel>
      </div>
      <div className="col-span-7 grid grid-cols-2 gap-2 md:grid-cols-3">
        {!loadingBanners && banners.length === 0 && (
          <p className="col-span-full text-sm text-muted-foreground">
            No banner images
          </p>
        )}
        {loadingBanners ? (
          <>
            <UiSkeleton className="aspect-video h-20 w-full rounded-md" />
            <UiSkeleton className="aspect-video h-20 w-full rounded-md" />
            <UiSkeleton className="aspect-video h-20 w-full rounded-md" />
          </>
        ) : (
          banners.map((banner) => (
            <div
              key={banner}
              className="aspect-video h-20 w-full overflow-hidden rounded-md border-2 bg-card"
            >
              <img
                alt={banner}
                src={banner}
                className="h-full w-full object-cover object-center"
              />
            </div>
          ))
        )}
      </div>
      <div className="col-span-5 mt-4 leading-none md:mt-0">
        <UiLabel>Categories</UiLabel>
      </div>
      <div className="col-span-7 flex flex-wrap items-center gap-2">
        {categories.length === 0 && (
          <p className="text-sm text-muted-foreground">No categories</p>
        )}
        {categories.map((category) => (
          <span
            key={category}
            className="inline-flex cursor-default items-center rounded-full border px-3 py-1.5 text-sm"
          >
            {category}
          </span>
        ))}
      </div>
      <div className="col-span-5 mt-4 leading-none md:mt-0">
        <UiLabel>Commands</UiLabel>
      </div>
      <table className="col-span-7">
        <thead>
          <tr>
            <th></th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {commands.map((command) => (
            <tr key={command.name}>
              <td className="pb-3 align-top">
                <span className="rounded-full border px-2 py-0.5 text-xs">
                  {EXTENSION_COMMAND_TYPE_NAME[command.type]}
                </span>
              </td>
              <td className="pb-3 align-top">
                <div className="ml-2 mt-px inline-block align-top">
                  <p>{command.title}</p>
                  <p className="text-sm leading-tight text-muted-foreground">
                    {command.description}
                  </p>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
