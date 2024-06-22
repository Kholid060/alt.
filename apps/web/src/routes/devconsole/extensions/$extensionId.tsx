import {
  ExtensionDetailHeader,
  ExtensionDetail,
  ExtensionDetailMarkdownAsset,
} from '@/components/extension/ExtensionDetail';
import ExtensionStatus from '@/components/extension/ExtensionStatus';
import {
  ExtensionUserDetail,
  ExtensionStatus as ExtensionStatusType,
} from '@/interface/extension.interface';
import APIService from '@/services/api.service';
import GithubAPI from '@/utils/GithubAPI';
import { PageError } from '@/utils/custom-error';
import {
  useDialog,
  useToast,
  UiDropdownMenu,
  UiDropdownMenuTrigger,
  UiButton,
  UiDropdownMenuContent,
  UiDropdownMenuItem,
  UiDropdownMenuSeparator,
  UiPopover,
  UiPopoverTrigger,
  UiPopoverContent,
  UiTextarea,
  UiPopoverClose,
  UiButtonLoader,
  UiSkeleton,
  UiBreadcrumb,
  UiBreadcrumbList,
  UiBreadcrumbItem,
  UiBreadcrumbLink,
  UiBreadcrumbSeparator,
  UiBreadcrumbPage,
  UiTabs,
  UiTabsList,
  UiTabsTrigger,
  UiTabsContent,
} from '@alt-dot/ui';
import { useQueryClient, useQuery, queryOptions } from '@tanstack/react-query';
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router';
import { EllipsisVerticalIcon, BlocksIcon } from 'lucide-react';
import { useState } from 'react';

const queryData = (extensionId: string) =>
  queryOptions({
    queryKey: ['me-extensions', extensionId],
    select(data) {
      return {
        ...data,
        baseAssetURL: new URL(data.sourceUrl).pathname + data.relativePath,
      };
    },
    queryFn: () => APIService.instance.me.getExtension(extensionId),
  });

export const Route = createFileRoute('/devconsole/extensions/$extensionId')({
  component: DevConsoleExtensionsDetailPage,
  loader: async ({ context: { queryClient }, params: { extensionId } }) => {
    await queryClient.prefetchQuery(queryData(extensionId));
  },
});

function ExtensionHeader({
  status,
  onRefetch,
  extension,
}: {
  onRefetch(): void;
  status: ExtensionStatusType;
  extension: ExtensionUserDetail;
}) {
  const dialog = useDialog();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function deleteExtensionEntry() {
    try {
      const confirmed = await dialog.confirm({
        title: `Cancel ${extension.isPublished ? 'update' : 'submit'} request`,
        body: "Are you sure you want to cancel your submission? You can't undo this action",
        okButtonVariant: 'destructive',
      });
      if (!confirmed) return;

      setIsLoading(true);

      await APIService.instance.me.deleteExtensionEntry(extension.id);

      if (extension.isPublished) onRefetch();
      else navigate({ to: '..', replace: true });
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: APIService.getErrorMessage(error),
      });
    } finally {
      setIsLoading(false);
    }
  }
  async function deleteExtension() {
    try {
      const confirmed = await dialog.confirm({
        title: 'Delete extension',
        body: "Are you sure you want to delete this extension? This will delete all data related to the extension, and this process can't be undone",
        okButtonVariant: 'destructive',
      });
      if (!confirmed) return;

      setIsLoading(true);
      await APIService.instance.me.deleteExtension(extension.id);

      navigate({ to: '..', replace: true });
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: APIService.getErrorMessage(error),
      });
    } finally {
      setIsLoading(false);
    }
  }
  async function resubmitExtension() {
    try {
      setIsLoading(true);

      const data = await APIService.instance.me.resubmitEntry(extension.id);
      if (!data.success) return;

      queryClient.setQueryData(['me-extensions', extension.id], {
        ...extension,
        entry: data.data,
      });

      toast({ title: 'Request submitted' });
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: APIService.getErrorMessage(error),
      });
    } finally {
      setIsLoading(false);
    }
  }
  async function createExtUpdateEntry() {
    try {
      setIsLoading(true);

      const data = await APIService.instance.me.createEntry(
        extension.id,
        reason.slice(0, 512),
      );
      if (!data.success) return;

      queryClient.setQueryData(['me-extensions', extension.id], {
        ...extension,
        entry: data.data,
      });

      toast({ title: 'Request submitted' });
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: APIService.getErrorMessage(error),
      });
    } finally {
      setReason('');
      setIsLoading(false);
    }
  }

  return (
    <ExtensionDetailHeader
      className="mt-8"
      title={extension.title}
      iconUrl={extension.iconUrl}
      version={extension.version}
      description={extension.description}
      icon={extension.iconUrl ?? 'icon:Command'}
      suffixSlot={
        <>
          <ExtensionStatus
            status={status}
            className="mt-2 md:mt-0 inline-block"
            rejectReason={extension.entry?.rejectReason}
          />
          <div className="flex items-center md:ml-4 mt-4 md:mt-0 w-full md:w-auto gap-2">
            <UiDropdownMenu>
              <UiDropdownMenuTrigger asChild>
                <UiButton size="icon" variant="outline" disabled={isLoading}>
                  <EllipsisVerticalIcon className="size-5" />
                </UiButton>
              </UiDropdownMenuTrigger>
              <UiDropdownMenuContent>
                <UiDropdownMenuItem asChild>
                  <a
                    href={`/store/extensions/${extension.id}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open store page
                  </a>
                </UiDropdownMenuItem>
                <UiDropdownMenuSeparator />
                {status === 'in-review' && (
                  <UiDropdownMenuItem
                    variant="destructive"
                    onClick={deleteExtensionEntry}
                  >
                    Cancel {extension.isPublished ? 'update' : 'submit'} request
                  </UiDropdownMenuItem>
                )}
                {(extension.isPublished || status === 'rejected') && (
                  <UiDropdownMenuItem
                    variant="destructive"
                    onClick={deleteExtension}
                  >
                    Delete extension
                  </UiDropdownMenuItem>
                )}
              </UiDropdownMenuContent>
            </UiDropdownMenu>
            {status === 'rejected' || !extension.isPublished ? (
              <UiButton
                className="flex-1 md:flex-auto"
                onClick={resubmitExtension}
                disabled={isLoading || status !== 'rejected'}
              >
                Resubmit
              </UiButton>
            ) : (
              <UiPopover>
                <UiPopoverTrigger asChild>
                  <UiButton
                    disabled={status !== 'published' || isLoading}
                    className="flex-1 md:flex-auto"
                  >
                    Update
                  </UiButton>
                </UiPopoverTrigger>
                <UiPopoverContent align="end">
                  <h4 className="font-medium leading-none">Update extension</h4>
                  <p className="text-sm text-muted-foreground leading-tight mt-2">
                    Write the reason of the update. For example:
                  </p>
                  <ul className="text-sm text-muted-foreground leading-tight list-disc">
                    <li className="ml-4">Update to v1.x.x</li>
                    <li className="ml-4">Update extension description</li>
                  </ul>
                  <UiTextarea
                    value={reason}
                    maxLength={512}
                    className="mt-4"
                    placeholder="Update extension description..."
                    onChange={(event) => setReason(event.target.value)}
                  />
                  <UiPopoverClose asChild>
                    <UiButtonLoader
                      isLoading={isLoading}
                      className="mt-2 w-full"
                      disabled={!reason.length}
                      onClick={createExtUpdateEntry}
                    >
                      Submit
                    </UiButtonLoader>
                  </UiPopoverClose>
                </UiPopoverContent>
              </UiPopover>
            )}
          </div>
        </>
      }
    />
  );
}

function DevConsoleExtensionsDetailPage() {
  const params = Route.useParams();
  const query = useQuery({
    refetchOnMount: false,
    refetchInterval: false,
    retry(failureCount, error) {
      if ('status' in error && error.status === 404) return false;

      return failureCount <= 3;
    },
    ...queryData(params.extensionId),
  });

  if (query.isPending) {
    return (
      <div className="pt-28 container">
        <div className="flex items-center">
          <UiSkeleton className="h-6 w-24" />
          <UiSkeleton className="h-6 w-32 ml-2" />
        </div>
        <div className="mt-8 flex items-center">
          <UiSkeleton className="size-14" />
          <div className="ml-4">
            <UiSkeleton className="h-7 w-40" />
            <UiSkeleton className="h-4 mt-2 w-64" />
          </div>
        </div>
        <hr className="my-8 border-border/40" />
        <UiSkeleton className="w-full max-w-xl h-64" />
      </div>
    );
  }

  if (query.isError) {
    const isNotFound = 'status' in query.error && query.error.status === 404;
    if (isNotFound) {
      throw new PageError(404, {
        btnText: 'Back to Dashboard',
        path: '/devconsole/extensions',
      });
    }

    return (
      <div className="flex flex-col place-items-center mt-12 max-w-md mx-auto text-center pt-28 container">
        <div className="inline-block rounded-full bg-card/60 p-6 text-muted-foreground">
          <BlocksIcon className="size-10" />
        </div>
        <h2 className="font-semibold mt-4 text-lg">
          Couldn&apos;t load extension
        </h2>
        {!isNotFound && (
          <p className="mt-1 leading-tight text-muted-foreground">
            Something went wrong when trying to fetch the extension
          </p>
        )}
        <UiButton className="mt-8 min-w-40" onClick={() => query.refetch()}>
          Try again
        </UiButton>
      </div>
    );
  }

  return (
    <div className="pt-28 container">
      <UiBreadcrumb>
        <UiBreadcrumbList>
          <UiBreadcrumbItem>
            <UiBreadcrumbLink asChild>
              <Link to="/devconsole/extensions">Dev Console</Link>
            </UiBreadcrumbLink>
          </UiBreadcrumbItem>
          <UiBreadcrumbSeparator />
          <UiBreadcrumbItem>
            <UiBreadcrumbPage>{query.data.title} extension</UiBreadcrumbPage>
          </UiBreadcrumbItem>
        </UiBreadcrumbList>
      </UiBreadcrumb>
      <ExtensionHeader
        extension={query.data}
        onRefetch={() => query.refetch()}
        status={query.data.entry?.status ?? 'published'}
      />
      <UiTabs className="mt-4 pb-24" variant="line" defaultValue="detail">
        <UiTabsList>
          <UiTabsTrigger value="detail" className="min-w-24">
            Detail
          </UiTabsTrigger>
          <UiTabsTrigger value="readme" className="min-w-24">
            Readme
          </UiTabsTrigger>
          <UiTabsTrigger value="changelog" className="min-w-24">
            Changelog
          </UiTabsTrigger>
        </UiTabsList>
        <UiTabsContent value="detail" className="pt-4">
          <ExtensionDetail
            banners={query.data.banners}
            categories={query.data.categories}
            commands={query.data.commands}
            sourceUrl={query.data.sourceUrl}
          />
        </UiTabsContent>
        <UiTabsContent value="changelog" className="pt-4">
          <ExtensionDetailMarkdownAsset
            filename="CHANGELOG.md"
            assetUrl={GithubAPI.getRawURL(
              query.data.baseAssetURL + '/CHANGELOG.md',
            )}
          />
        </UiTabsContent>
        <UiTabsContent value="readme" className="pt-4">
          <ExtensionDetailMarkdownAsset
            filename="README.md"
            assetUrl={GithubAPI.getRawURL(
              query.data.baseAssetURL + '/README.md',
            )}
          />
        </UiTabsContent>
      </UiTabs>
    </div>
  );
}
