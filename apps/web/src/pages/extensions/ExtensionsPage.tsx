import GithubAPIService from '@/services/api/github-api.service';
import { FetchError } from '@/utils/afetch';
import {
  UiButton,
  UiDialog,
  UiInput,
  UiLabel,
  UiSkeleton,
  useToast,
} from '@alt-dot/ui';
import { useState } from 'react';
import { parseJSON } from '@alt-dot/shared';
import { ExtensionManifestSchema } from '@alt-dot/extension-core';
import { useUserStore } from '@/stores/user.store';
import { Link, useNavigate } from 'react-router-dom';
import { ExtensionNewPayload } from './ExtensionsNewPage';
import { useQuery } from '@tanstack/react-query';
import APIService from '@/services/api.service';
import dayjs from 'dayjs';
import ExtensionStatus from '@/components/extension/ExtensionStatus';
import ExtensionIcon from '@/components/extension/ExtensionIcon';

function ExtensionsNewButton() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const profile = useUserStore.use.profile();

  const [repoUrl, setRepoUrl] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    if (!profile) return;

    event.preventDefault();

    try {
      const url = new URL(repoUrl);
      const [_, owner, repo] = url.pathname.split('/');
      if (!url.origin.startsWith('https://github.com') || !owner || !repo) {
        setErrorMessage('Invalid GitHub repository URL');
        return;
      }

      const manifestFile = await GithubAPIService.instance.getRepoContents(
        owner,
        repo,
        'dist/manifest.json',
      );
      const manifestContent = parseJSON(
        Array.isArray(manifestFile)
          ? 'null'
          : atob(manifestFile.content ?? '') ?? 'null',
        null,
      );
      if (!manifestContent || Array.isArray(manifestFile)) {
        toast({
          variant: 'destructive',
          title: 'Couldn\'t parse the extension "manifest.json" file',
        });
        return;
      }

      const manifest =
        await ExtensionManifestSchema.safeParseAsync(manifestContent);
      if (!manifest.success) {
        toast({
          variant: 'destructive',
          title: 'Error when validate the extension manifest',
        });
        console.error(manifest.error);
        return;
      }

      if (manifest.data.author !== profile.username) {
        toast({
          variant: 'destructive',
          title: 'Mismatch username',
          description:
            'Make sure your alt. account username matches the author field in the manifest.json file',
        });
        return;
      }

      const extensionExists = await APIService.instance.meExtensionExists(
        manifest.data.name,
      );
      if (!extensionExists) {
        toast({
          variant: 'destructive',
          title: 'Extension exists',
          description: 'This extension is already been added',
        });
        return;
      }

      navigate('new', {
        state: {
          repo: {
            owner,
            name: repo,
            url: `https://github.com/${owner}/${repo}`,
            branch: new URL(manifestFile.url).searchParams.get('ref'),
          },
          manifest: manifest.data,
        } as ExtensionNewPayload,
      });
    } catch (error) {
      let message = 'Something went wrong!';
      if (FetchError.isFetchError(error)) {
        message =
          error.status === 404
            ? 'Couldn\'t find the extension "manifest.json" file'
            : error.message || error.statusText;
      }

      toast({
        title: message,
        variant: 'destructive',
      });

      console.error(error);
    } finally {
      setErrorMessage('');
    }
  }

  return (
    <UiDialog>
      <UiDialog.Trigger asChild>
        <UiButton>New extension</UiButton>
      </UiDialog.Trigger>
      <UiDialog.Content className="sm:max-w-[425px]">
        <UiDialog.Header>
          <UiDialog.Title>New extension</UiDialog.Title>
          <UiDialog.Description>
            Input the GitHub repository URL of your extension
          </UiDialog.Description>
        </UiDialog.Header>
        <form onSubmit={onSubmit}>
          <UiLabel htmlFor="extension-repo-url" className="ml-1">
            GitHub repository URL
          </UiLabel>
          <UiInput
            type="url"
            value={repoUrl}
            id="extension-repo-url"
            onValueChange={setRepoUrl}
            placeholder="https://github.com/owner/repo"
          />
          {errorMessage && (
            <p className="text-destructive-text ml-1 text-sm">{errorMessage}</p>
          )}
          <UiDialog.Footer className="mt-6">
            <UiButton disabled={!repoUrl} className="min-w-24" type="submit">
              Continue
            </UiButton>
          </UiDialog.Footer>
        </form>
      </UiDialog.Content>
    </UiDialog>
  );
}

function ExtensionsList() {
  const query = useQuery({
    refetchInterval: false,
    refetchOnWindowFocus: false,
    queryKey: ['me-extensions'],
    queryFn: () => APIService.instance.listMeExtensions(),
  });

  if (query.isLoading || query.isRefetchError) {
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
            className="min-w-32 mt-4"
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
          className="p-3 text-muted-foreground text-sm text-center"
        >
          No data
        </td>
      </tr>
    );
  }

  return (query.data ?? []).map((item) => (
    <tr key={item.id} className="hover:bg-card">
      <td className="p-3">
        <Link className="flex items-center" to={item.id}>
          <ExtensionIcon
            className="size-5"
            title={item.title}
            icon={item.iconUrl}
            iconUrl={item.iconUrl}
          />
          <div className="ml-3">
            <p className="leading-tight">{item.title}</p>
            <p className="text-sm text-muted-foreground leading-tight">
              v{item.version}
            </p>
          </div>
        </Link>
      </td>
      <td className="p-3">
        <p>{dayjs(item.updatedAt).format('DD MMM YYYY, HH:mm')}</p>
      </td>
      <td className="p-3 text-left">
        <p className="tabular-nums">{item.downloadCount}x</p>
      </td>
      <td className="p-3 text-right">
        <ExtensionStatus status={item.status} />
      </td>
    </tr>
  ));
}

function ExtensionsPage() {
  return (
    <div className="pt-36 container">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold cursor-default leading-tight -mt-0.5">
          Extensions
        </h2>
        <ExtensionsNewButton />
      </div>
      <div className="mt-8 rounded-lg border w-full overflow-x-auto overflow-y-hidden">
        <table className="w-full">
          <thead className="text-sm border-b h-12 w-full">
            <tr className="text-left">
              <th className="h-12 px-4 w-5/12 min-w-56">Name</th>
              <th className="h-12 px-4 w-3/12 min-w-32">Last updated</th>
              <th className="h-12 px-4 w-2/12 text-left min-w-48">
                Download count
              </th>
              <th className="h-12 px-4 w-2/12 min-w-32"></th>
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

export default ExtensionsPage;
