import GithubAPIService from '@/services/api/github-api.service';
import { afetch } from '@/utils/afetch';
import { UiExtIcon } from '@alt-dot/extension';
import { ExtensionManifest } from '@alt-dot/extension-core';
import { isObject } from '@alt-dot/shared';
import {
  UiBreadcrumb,
  UiBreadcrumbItem,
  UiBreadcrumbLink,
  UiBreadcrumbList,
  UiBreadcrumbPage,
  UiBreadcrumbSeparator,
  UiButton,
  UiDropdownMenu,
  UiDropdownMenuContent,
  UiDropdownMenuItem,
  UiDropdownMenuLabel,
  UiDropdownMenuSeparator,
  UiDropdownMenuTrigger,
  UiImage,
  UiInput,
  UiLabel,
  UiSkeleton,
  UiTabs,
  UiTabsContent,
  UiTabsList,
  UiTabsTrigger,
} from '@alt-dot/ui';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Link, Location, Navigate, useLocation } from 'react-router-dom';
import { z } from 'zod';
import Markdown from 'markdown-to-jsx';
import { FileIcon, PlusIcon, XCircleIcon } from 'lucide-react';
import UiHighlight from '@/components/ui/UiHighlight';
import { EXTENSION_CATEGORIES } from '@/utils/constant';

const extensionNewPayload = z.object({
  manifest: z.custom<ExtensionManifest>((data) => isObject(data)),
  repo: z.object({
    url: z.string(),
    name: z.string(),
    owner: z.string(),
    branch: z.string(),
  }),
});
export type ExtensionNewPayload = z.infer<typeof extensionNewPayload>;

function ExtensionIcon({
  iconUrl,
  manifest,
}: ExtensionNewPayload & { iconUrl: string }) {
  if (manifest.icon.startsWith('icon:')) {
    const Icon =
      UiExtIcon[manifest.icon.split(':')[1] as keyof typeof UiExtIcon] ??
      UiExtIcon.Command;

    return (
      <div className="p-2 rounded-lg border bg-card border-border/40 text-muted-foreground">
        <Icon className="size-8" />
      </div>
    );
  }

  return (
    <UiImage src={iconUrl} className="size-9" alt={`${manifest.title} icon`} />
  );
}

function ExtensionReadme({
  repo,
  readmeUrl,
}: ExtensionNewPayload & { readmeUrl: string }) {
  const query = useQuery({
    refetchOnMount: false,
    refetchInterval: false,
    queryKey: ['assets', repo.owner, repo.name],
    queryFn: () =>
      afetch<string>(readmeUrl, {
        responseType: 'text',
        headers: { 'Content-Type': 'text/plain' },
      }),
  });

  if (query.isLoading || query.isRefetching) {
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
    return (
      <div className="flex flex-col place-items-center mt-12 max-w-md mx-auto text-center">
        <div className="inline-block rounded-full bg-card/60 p-6 text-muted-foreground">
          <FileIcon className="size-10" />
        </div>
        <h2 className="font-semibold mt-4 text-lg">
          Couldn&apos;t load README.md file
        </h2>
        <p className="mt-1 leading-tight text-muted-foreground">
          Something went wrong when trying to fetch the README.md file
        </p>
        <UiButton className="mt-8 min-w-40" onClick={() => query.refetch()}>
          Try again
        </UiButton>
      </div>
    );
  }

  return (
    <div className="prose dark:prose-invert prose-pre:rounded-lg prose-pre:bg-card prose-code:bg-card prose-hr:border-border prose-img:rounded-lg prose-thead:border-border prose-tr:border-border max-w-3xl">
      <Markdown>{query.data ?? ''}</Markdown>
    </div>
  );
}

const BANNER_NAME_REGEX = /banner-[0-9]*.png/;
function ExtensionDetail({
  repo,
  assetBaseURL,
}: ExtensionNewPayload & { assetBaseURL: string }) {
  const query = useQuery({
    refetchOnMount: false,
    refetchInterval: false,
    queryKey: ['contents-dist', repo.owner, repo.name],
    queryFn: () =>
      GithubAPIService.instance.getRepoContents(repo.owner, repo.name, 'dist'),
  });

  const [categories, setCategories] = useState<string[]>([]);

  const banners = useMemo(
    () =>
      Array.isArray(query.data)
        ? query.data
            .filter(
              (item) =>
                item.type === 'file' && BANNER_NAME_REGEX.test(item.name),
            )
            .slice(0, 10)
        : [],
    [query.data],
  );

  return (
    <div className="md:grid grid-cols-12 items-start max-w-3xl gap-x-4 gap-y-8">
      <div className="col-span-5">
        <UiLabel htmlFor="extension-repo-url">Extension repository URL</UiLabel>
      </div>
      <UiInput
        readOnly
        value={repo.url}
        className="col-span-7"
        id="extension-repo-url"
        onClick={(event) => (event.target as HTMLInputElement).select()}
      />
      <div className="col-span-5 mt-4 md:mt-0">
        <UiLabel>Banner images</UiLabel>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 col-span-7 gap-2">
        {!query.isLoading && banners.length === 0 && (
          <p className="col-span-full text-muted-foreground text-sm">
            No banner images
          </p>
        )}
        {query.isLoading ? (
          <>
            <UiSkeleton className="aspect-video h-20 w-full rounded-md" />
            <UiSkeleton className="aspect-video h-20 w-full rounded-md" />
            <UiSkeleton className="aspect-video h-20 w-full rounded-md" />
          </>
        ) : (
          banners.map((banner) => (
            <div
              key={banner.name}
              className="aspect-video h-20 w-full rounded-md border-2 bg-card overflow-hidden"
            >
              <img
                alt={banner.name}
                className="object-cover object-center w-full h-full"
                src={`${assetBaseURL}/${banner.path}`}
              />
            </div>
          ))
        )}
      </div>
      <div className="col-span-5 mt-4 md:mt-0">
        <UiLabel>Category</UiLabel>
      </div>
      <div className="flex items-center col-span-7 gap-2 flex-wrap">
        {categories.map((category) => (
          <span
            key={category}
            className="py-1.5 px-3 rounded-full border text-sm inline-flex items-center"
          >
            {category}
            <XCircleIcon
              className="text-muted-foreground size-5 ml-2 cursor-pointer"
              onClick={() =>
                setCategories(categories.filter((item) => item !== category))
              }
            />
          </span>
        ))}
        <UiDropdownMenu>
          <UiDropdownMenuTrigger asChild>
            <UiButton variant="secondary">
              <PlusIcon className="size-5 -ml-1 mr-2" />
              Add
            </UiButton>
          </UiDropdownMenuTrigger>
          <UiDropdownMenuContent align="start" className="w-56">
            <UiDropdownMenuLabel>Add category</UiDropdownMenuLabel>
            <UiDropdownMenuSeparator />
            {EXTENSION_CATEGORIES.map((item) =>
              categories.includes(item) ? null : (
                <UiDropdownMenuItem
                  key={item}
                  onClick={() => setCategories([...categories, item])}
                >
                  {item}
                </UiDropdownMenuItem>
              ),
            )}
          </UiDropdownMenuContent>
        </UiDropdownMenu>
      </div>
    </div>
  );
}

function ExtensionManifestView({
  manifest,
}: Pick<ExtensionNewPayload, 'manifest'>) {
  return (
    <div className="whitespace-pre-wrap rounded-lg border bg-card p-4 text-sm">
      <UiHighlight code={JSON.stringify(manifest, null, 4)} />
    </div>
  );
}

function ExtensionsPage() {
  const location = useLocation() as Location<{
    sourceUrl: string;
    branchName: string;
    manifest: ExtensionManifest;
  }>;

  const state = useMemo(
    () => extensionNewPayload.safeParse(location.state),
    [location.state],
  );

  if (!state.success) {
    return <Navigate to="/devconsole/extensions" replace />;
  }

  const { manifest, repo } = state.data;
  const getAssetURL = GithubAPIService.getRawURL(
    `${repo.owner}/${repo.name}/${repo.branch}`,
    true,
  );

  console.log(manifest, repo);

  const extensionIcon = (
    <ExtensionIcon
      repo={repo}
      manifest={manifest}
      iconUrl={getAssetURL(`/dist/icon/${manifest.icon}.png`)}
    />
  );

  return (
    <div className="pt-28 container">
      <UiBreadcrumb>
        <UiBreadcrumbList>
          <UiBreadcrumbItem>
            <UiBreadcrumbLink asChild>
              <Link to="/devconsole/extensions">Manage extensions</Link>
            </UiBreadcrumbLink>
          </UiBreadcrumbItem>
          <UiBreadcrumbSeparator />
          <UiBreadcrumbItem>
            <UiBreadcrumbPage>New extension</UiBreadcrumbPage>
          </UiBreadcrumbItem>
        </UiBreadcrumbList>
      </UiBreadcrumb>
      <div className="flex items-center mt-8">
        {extensionIcon}
        <div className="ml-4 flex-grow">
          <h2 className="text-2xl font-semibold cursor-default leading-tight">
            {manifest.title}
          </h2>
          <p className="text-sm text-muted-foreground leading-tight line-clamp-1">
            {manifest.description}
          </p>
        </div>
        <UiButton className="ml-4">Submit</UiButton>
      </div>
      <UiTabs className="mt-4 pb-24" variant="line" defaultValue="detail">
        <UiTabsList>
          <UiTabsTrigger value="detail" className="min-w-24">
            Detail
          </UiTabsTrigger>
          <UiTabsTrigger value="manifest" className="min-w-24">
            Manifest
          </UiTabsTrigger>
          <UiTabsTrigger value="readme" className="min-w-24">
            Readme
          </UiTabsTrigger>
        </UiTabsList>
        <UiTabsContent value="detail" className="pt-4">
          <ExtensionDetail
            manifest={manifest}
            repo={repo}
            assetBaseURL={getAssetURL('')}
          />
        </UiTabsContent>
        <UiTabsContent value="manifest" className="pt-4">
          <ExtensionManifestView manifest={manifest} />
        </UiTabsContent>
        <UiTabsContent value="readme" className="pt-4">
          <ExtensionReadme
            repo={repo}
            manifest={manifest}
            readmeUrl={getAssetURL('/README.md')}
          />
        </UiTabsContent>
      </UiTabs>
    </div>
  );
}

export default ExtensionsPage;
