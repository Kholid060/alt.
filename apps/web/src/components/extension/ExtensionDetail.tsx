import { Extension } from '@/interface/extension.interface';
import { afetch } from '@alt-dot/shared';
import {
  UiButton,
  UiIcons,
  UiImage,
  UiInput,
  UiLabel,
  UiSkeleton,
} from '@alt-dot/ui';
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
      <div className="p-2 rounded-md border bg-card border-border/40 text-muted-foreground inline-block">
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
    <div className={clsx('md:flex items-center', className)} {...props}>
      <ExtensionDetailIcon
        icon={icon}
        title={title}
        iconUrl={iconUrl}
        svgClass="size-11"
        imageClass="size-12"
      />
      <div className="md:ml-4 flex-grow">
        <h2 className="text-2xl font-semibold cursor-default leading-tight">
          {title}
        </h2>
        <p className="text-sm text-muted-foreground leading-tight line-clamp-1">
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
      <div className="space-y-2 mt-4">
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

    return (
      <div className="flex flex-col place-items-center mt-12 max-w-md mx-auto text-center">
        <div className="inline-block rounded-full bg-card/60 p-6 text-muted-foreground">
          <FileIcon className="size-10" />
        </div>
        <h2 className="font-semibold mt-4 text-lg">
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
    <div className="grid grid-cols-1 md:grid-cols-12 items-start max-w-3xl gap-x-4 md:gap-y-8 gap-y-2">
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
      <div className="col-span-5 leading-none mt-4 md:mt-0">
        <UiLabel>Banner images</UiLabel>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 col-span-7 gap-2">
        {!loadingBanners && banners.length === 0 && (
          <p className="col-span-full text-muted-foreground text-sm">
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
              className="aspect-video h-20 w-full rounded-md border-2 bg-card overflow-hidden"
            >
              <img
                alt={banner}
                src={banner}
                className="object-cover object-center w-full h-full"
              />
            </div>
          ))
        )}
      </div>
      <div className="col-span-5 leading-none mt-4 md:mt-0">
        <UiLabel>Categories</UiLabel>
      </div>
      <div className="flex items-center col-span-7 gap-2 flex-wrap">
        {categories.length === 0 && (
          <p className="text-muted-foreground text-sm">No categories</p>
        )}
        {categories.map((category) => (
          <span
            key={category}
            className="py-1.5 px-3 cursor-default rounded-full border text-sm inline-flex items-center"
          >
            {category}
          </span>
        ))}
      </div>
      <div className="col-span-5 leading-none mt-4 md:mt-0">
        <UiLabel>Commands</UiLabel>
      </div>
      <ul className="col-span-7 space-y-3">
        {commands.map((command) => (
          <li key={command.name}>
            <span className="px-2 py-0.5 border rounded-full text-xs">
              {EXTENSION_COMMAND_TYPE_NAME[command.type]}
            </span>
            <div className="inline-block align-top ml-2 mt-px">
              <p>{command.title}</p>
              <p className="text-muted-foreground leading-tight">
                {command.description}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
