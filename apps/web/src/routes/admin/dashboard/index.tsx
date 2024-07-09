import { ExtensionDetailIcon } from '@/components/extension/ExtensionDetail';
import ExtensionStatus from '@/components/extension/ExtensionStatus';
import UiCodeEditor from '@/components/ui/UiCodeEditor';
import UiMarkdown from '@/components/ui/UiMarkdown';
import { authGuard } from '@/guards/auth.guard';
import { AdminExtensionListItem } from '@/interface/admin.interface';
import APIService from '@/services/api.service';
import GithubAPI from '@/utils/GithubAPI';
import { EXT_BANNER_NAME_REGEX, UserRole } from '@/utils/constant';
import { routeBeforeLoadPipe } from '@/utils/route-utils';
import { ExtensionManifestSchema } from '@altdot/extension';
import {
  ApiAdminSetExtentionEntryPayload,
  afetch,
  parseJSON,
} from '@altdot/shared';
import {
  useToast,
  UiDialog,
  UiLabel,
  UiInput,
  UiButton,
  UiToggle,
  UiTextarea,
  UiAvatar,
  UiAvatarImage,
  UiAvatarFallback,
  UiDropdownMenu,
  UiDropdownMenuTrigger,
  UiDropdownMenuContent,
  UiDropdownMenuItem,
  UiDropdownMenuSeparator,
  UiDropdownMenuLabel,
  UiDropdownMenuSub,
  UiDropdownMenuSubTrigger,
  UiDropdownMenuSubContent,
  UiSkeleton,
} from '@altdot/ui';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute, redirect } from '@tanstack/react-router';
import dayjs from 'dayjs';
import {
  EyeIcon,
  UserRoundIcon,
  EllipsisIcon,
  ExternalLinkIcon,
  FileTextIcon,
  CircleCheckBigIcon,
  CheckIcon,
  XIcon,
} from 'lucide-react';
import { useState } from 'react';
import { useDebounceCallback } from 'usehooks-ts';

export const Route = createFileRoute('/admin/dashboard/')({
  component: AdminPage,
  beforeLoad: (data) =>
    routeBeforeLoadPipe(data, [authGuard], () => {
      if (data.context.userProfile?.role !== UserRole.Admin) {
        throw redirect({
          to: '/',
        });
      }
    }),
});

type ApproveExtPayload = Extract<
  ApiAdminSetExtentionEntryPayload,
  { type: 'approved' }
>['extension'];

function ExtensionApproveRequest({
  onClose,
  extension,
  onApprove,
}: {
  onClose(): void;
  extension: AdminExtensionListItem;
  onApprove(payload: ApproveExtPayload): void;
}) {
  const { toast } = useToast();

  const [downloadUrl, setDownloadUrl] = useState('');
  const [updatePayload, setUpdatePayload] = useState('');

  async function fetchExtDetail() {
    try {
      const [_, owner, repo] = new URL(extension.sourceUrl).pathname.split('/');
      const distFiles = await GithubAPI.instance
        .getRepoContents(owner, repo, 'dist')
        .then((result) => (Array.isArray(result) ? result : [result]));

      let manifestRawUrl = '';
      const newUpdatePayload: ApproveExtPayload = {
        banners: [] as string[],
      };

      for (const file of distFiles) {
        if (EXT_BANNER_NAME_REGEX.test(file.name)) {
          newUpdatePayload.banners!.push(file.download_url);
        } else if (file.name === 'manifest.json') {
          manifestRawUrl = file.download_url;
        }
      }

      newUpdatePayload.banners = newUpdatePayload.banners!.slice(0, 10);

      if (!manifestRawUrl) {
        toast({
          variant: 'destructive',
          title: 'Couldn\'t find the extension "manifest.json" file',
        });
        setUpdatePayload(JSON.stringify(updatePayload, null, 2));

        return;
      }

      const manifestContent = await afetch(manifestRawUrl, {
        headers: { 'Content-Type': 'text/plain' },
      });
      const manifest =
        await ExtensionManifestSchema.safeParseAsync(manifestContent);
      if (!manifest.success) {
        toast({
          variant: 'destructive',
          title: 'Error when validate the extension manifest',
        });
        console.dir(manifest.error);
        return;
      }

      setUpdatePayload(
        JSON.stringify(
          {
            ...newUpdatePayload,
            title: manifest.data.title,
            version: manifest.data.version,
            commands: manifest.data.commands.map((command) => ({
              name: command.name,
              type: command.type,
              title: command.title,
              description: command.description ?? '',
            })),
            categories: manifest.data.categories,
            apiVersion: manifest.data.$apiVersion,
            description: manifest.data.description,
            permissions: manifest.data.permissions,
            iconUrl: manifest.data.icon.startsWith('icon:')
              ? manifest.data.icon
              : GithubAPI.getRawURL(
                  `/${owner}/${repo}/${extension.relativePath}/dist/${manifest.data.icon}`,
                ),
          },
          null,
          2,
        ),
      );
    } catch (error) {
      toast({
        variant: 'destructive',
        title: APIService.getErrorMessage(error, {
          404: 'Couldn\'t find the extension "dist" folder',
        }),
      });
    }
  }

  return (
    <UiDialog open modal onOpenChange={onClose}>
      <UiDialog.Content className="max-w-xl gap-0">
        <UiDialog.Header>
          <UiDialog.Title>
            Approve &quot;{extension.title}&quot; request
          </UiDialog.Title>
        </UiDialog.Header>
        <div className="mt-6 flex items-center justify-between">
          <UiLabel className="ml-1">Update payload</UiLabel>
          <button
            tabIndex={-1}
            onClick={fetchExtDetail}
            className="text-sm text-muted-foreground underline"
          >
            Fetch extension detail
          </button>
        </div>
        <UiCodeEditor
          value={updatePayload}
          onChange={setUpdatePayload}
          className="max-h-96 min-h-32 w-full overflow-auto rounded-md border text-sm"
        />
        <div className="mt-2">
          <UiLabel className="ml-1" htmlFor="download-url-input">
            Download URL
          </UiLabel>
          <UiInput
            type="url"
            value={downloadUrl}
            id="download-url-input"
            onValueChange={setDownloadUrl}
            placeholder="https://example.com/extension-file.zip"
          />
        </div>
        <UiDialog.Footer className="mt-8">
          <UiButton className="min-w-24" onClick={onClose} variant="ghost">
            Cancel
          </UiButton>
          <UiButton
            className="min-w-24"
            onClick={() =>
              onApprove(
                parseJSON<ApproveExtPayload, ApproveExtPayload>(
                  updatePayload,
                  {},
                ),
              )
            }
          >
            Approve
          </UiButton>
        </UiDialog.Footer>
      </UiDialog.Content>
    </UiDialog>
  );
}

function ExtensionRejectRequest({
  onClose,
  onReject,
  extension,
}: {
  onClose(): void;
  onReject(reason: string): void;
  extension: AdminExtensionListItem;
}) {
  const [preview, setPreview] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  return (
    <UiDialog open onOpenChange={onClose}>
      <UiDialog.Content>
        <UiDialog.Header>
          <UiDialog.Title>
            Reject &quot;{extension.title}&quot; request
          </UiDialog.Title>
        </UiDialog.Header>
        <div>
          <div className="flex items-center">
            <UiLabel className="ml-1" htmlFor="reject-reason-textarea">
              Reject reason
            </UiLabel>
            <div className="flex-grow"></div>
            <UiToggle
              tabIndex={-1}
              pressed={preview}
              size="sm"
              onPressedChange={setPreview}
            >
              <EyeIcon className="size-5" />
            </UiToggle>
          </div>
          {preview ? (
            <UiMarkdown
              className="prose-sm mt-2 rounded-lg border p-2"
              markdown={rejectReason}
            />
          ) : (
            <UiTextarea
              className="mt-1"
              value={rejectReason}
              id="reject-reason-textarea"
              onChange={(event) => setRejectReason(event.target.value)}
            />
          )}
        </div>
        <UiDialog.Footer className="mt-4">
          <UiButton className="min-w-24" onClick={onClose} variant="ghost">
            Cancel
          </UiButton>
          <UiButton
            variant="destructive"
            className="min-w-24"
            onClick={() => onReject(rejectReason)}
          >
            Reject
          </UiButton>
        </UiDialog.Footer>
      </UiDialog.Content>
    </UiDialog>
  );
}

function ExtensionListItem({
  item,
  onRefetch,
}: {
  item: AdminExtensionListItem;
  onRefetch(): void;
}) {
  const { toast } = useToast();

  const [state, setState] = useState<'approve' | 'reject' | null>(null);

  async function setExtensionRequest(
    payload: ApiAdminSetExtentionEntryPayload,
  ) {
    try {
      if (!item.entry) return;

      setState(null);

      await APIService.instance.admin.setExtensionEntry(
        {
          extensionId: item.id,
          entryId: item.entry.id,
        },
        payload,
      );

      onRefetch();
      toast({ title: `${item.title} updated` });
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: APIService.getErrorMessage(error),
      });
    }
  }

  return (
    <>
      {state === 'approve' ? (
        <ExtensionApproveRequest
          extension={item}
          onClose={() => setState(null)}
          onApprove={(payload) =>
            setExtensionRequest({ type: 'approved', extension: payload })
          }
        />
      ) : state === 'reject' ? (
        <ExtensionRejectRequest
          extension={item}
          onClose={() => setState(null)}
          onReject={(reason) =>
            setExtensionRequest({ type: 'rejected', reason })
          }
        />
      ) : null}
      <tr className="border-b border-border/50 last:border-b-0 hover:bg-card">
        <td className="p-3">
          <a
            href={`/store/extensions/${item.id}/${item.name}`}
            target="_blank"
            className="flex items-center"
            rel="noreferrer"
          >
            <ExtensionDetailIcon
              className="size-5"
              title={item.title}
              icon={item.iconUrl}
              iconUrl={item.iconUrl}
            />
            <div className="ml-3">
              <p className="leading-tight">{item.title}</p>
              <p className="text-sm leading-tight text-muted-foreground">
                <span>{item.isPublished ? '✅' : '❌'}Published</span>
                {' • '}
                <span>v{item.version}</span>
              </p>
            </div>
          </a>
        </td>
        <td className="p-3">
          <a
            href={`/u/${item.owner.username}`}
            target="_blank"
            className="line-clamp-1 transition-colors hover:text-foreground"
            rel="noreferrer"
          >
            <UiAvatar className="inline-block size-5 align-middle">
              {item.owner.avatarUrl && (
                <UiAvatarImage src={item.owner.avatarUrl} />
              )}
              <UiAvatarFallback>
                <UserRoundIcon className="size-4" />
              </UiAvatarFallback>
            </UiAvatar>
            <span className="ml-1.5 align-middle">{item.owner.name}</span>
          </a>
        </td>
        <td className="p-3">
          <p>{dayjs(item.updatedAt).format('DD MMM YYYY, HH:mm')}</p>
        </td>
        <td className="p-3 text-left">
          <p className="tabular-nums">{item.downloadCount}x</p>
        </td>
        <td className="p-3">
          <div className="flex items-center justify-end">
            <ExtensionStatus
              rejectReason={item.entry?.rejectReason}
              className="flex-shrink-0"
              status={item.entry?.status ?? 'published'}
            />
            <UiDropdownMenu>
              <UiDropdownMenuTrigger asChild>
                <UiButton
                  variant="secondary"
                  size="icon"
                  className="ml-2 flex-shrink-0"
                >
                  <EllipsisIcon className="size-5" />
                </UiButton>
              </UiDropdownMenuTrigger>
              <UiDropdownMenuContent align="end">
                <UiDropdownMenuItem asChild>
                  <a href={item.sourceUrl} target="_blank" rel="noreferrer">
                    <ExternalLinkIcon className="mr-2 size-4" />
                    Open extension source
                  </a>
                </UiDropdownMenuItem>
                {item.entry?.status !== 'published' && (
                  <>
                    <UiDropdownMenuSeparator />
                    <UiDropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                      {item.isPublished ? 'Update' : 'Submit'} request
                    </UiDropdownMenuLabel>
                    {item.entry?.updateReason && (
                      <UiDropdownMenuSub>
                        <UiDropdownMenuSubTrigger>
                          <FileTextIcon className="mr-2 size-4" />
                          Reason
                        </UiDropdownMenuSubTrigger>
                        <UiDropdownMenuSubContent className="min-h-12 max-w-md whitespace-pre-wrap p-2 text-sm">
                          {item.entry.updateReason}
                        </UiDropdownMenuSubContent>
                      </UiDropdownMenuSub>
                    )}
                    <UiDropdownMenuSub>
                      <UiDropdownMenuSubTrigger>
                        <CircleCheckBigIcon className="mr-2 size-4" />
                        Approve/reject
                      </UiDropdownMenuSubTrigger>
                      <UiDropdownMenuSubContent className="min-h-12 max-w-md p-2 text-sm">
                        <UiDropdownMenuItem
                          className="text-green-400"
                          onClick={() => setState('approve')}
                        >
                          <CheckIcon className="mr-2 size-4" />
                          Approve
                        </UiDropdownMenuItem>
                        <UiDropdownMenuItem
                          className="text-destructive-text"
                          onClick={() => setState('reject')}
                        >
                          <XIcon className="mr-2 size-4" />
                          Reject
                        </UiDropdownMenuItem>
                      </UiDropdownMenuSubContent>
                    </UiDropdownMenuSub>
                  </>
                )}
              </UiDropdownMenuContent>
            </UiDropdownMenu>
          </div>
        </td>
      </tr>
    </>
  );
}

function ExtensionsList() {
  const query = useQuery({
    refetchInterval: false,
    refetchOnWindowFocus: false,
    queryKey: ['admin-extensions'],
    queryFn: () => APIService.instance.admin.listExtensions(),
  });

  const refetchDebounce = useDebounceCallback(() => {
    query.refetch();
  }, 2000);

  if (query.isPending) {
    return (
      <>
        <tr>
          <td colSpan={50} className="px-3 pt-3">
            <UiSkeleton className="h-10" />
          </td>
        </tr>
        <tr>
          <td colSpan={50} className="px-3 py-2">
            <UiSkeleton className="h-10" />
          </td>
        </tr>
        <tr>
          <td colSpan={50} className="px-3 pb-3">
            <UiSkeleton className="h-10" />
          </td>
        </tr>
      </>
    );
  }
  if (query.isError) {
    return (
      <tr>
        <td colSpan={50} className="p-3 text-center">
          <p className="text-sm text-destructive-text">
            Failed to fetch extensions list
          </p>
          <UiButton
            size="sm"
            variant="secondary"
            className="mt-4 min-w-32"
            onClick={() => query.refetch()}
          >
            Retry
          </UiButton>
        </td>
      </tr>
    );
  }
  if (query.data && query.data.length === 0) {
    return (
      <tr>
        <td
          colSpan={50}
          className="p-3 text-center text-sm text-muted-foreground"
        >
          No data
        </td>
      </tr>
    );
  }

  return (query.data ?? []).map((item) => (
    <ExtensionListItem key={item.id} item={item} onRefetch={refetchDebounce} />
  ));
}

function AdminPage() {
  return (
    <div className="container pt-36">
      <h2 className="-mt-0.5 cursor-default text-2xl font-semibold leading-tight">
        Admin Dashboard
      </h2>
      <div className="mt-8 w-full overflow-x-auto overflow-y-hidden rounded-lg border">
        <table className="w-full">
          <thead className="h-12 w-full border-b text-sm">
            <tr className="text-left">
              <th className="h-12 w-4/12 min-w-64 px-4 lg:min-w-0">Name</th>
              <th className="h-12 w-2/12 min-w-40 px-4 lg:min-w-0">Owner</th>
              <th className="h-12 w-2/12 min-w-40 px-4 lg:min-w-0">
                Last updated
              </th>
              <th className="h-12 w-2/12 min-w-40 px-4 text-left lg:min-w-0">
                Downloads count
              </th>
              <th className="h-12 w-2/12 min-w-32 px-4"></th>
            </tr>
          </thead>
          <tbody>
            <ExtensionsList />
          </tbody>
        </table>
      </div>
    </div>
  );
}
