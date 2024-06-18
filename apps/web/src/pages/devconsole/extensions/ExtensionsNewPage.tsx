import GithubAPI from '@/utils/GithubAPI';
import { ExtensionManifest } from '@alt-dot/extension-core';
import { isObject } from '@alt-dot/shared';
import {
  UiBreadcrumb,
  UiBreadcrumbItem,
  UiBreadcrumbLink,
  UiBreadcrumbList,
  UiBreadcrumbPage,
  UiBreadcrumbSeparator,
  UiButtonLoader,
  UiTabs,
  UiTabsContent,
  UiTabsList,
  UiTabsTrigger,
  useDialog,
  useToast,
} from '@alt-dot/ui';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import {
  Link,
  Location,
  Navigate,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import { z } from 'zod';
import UiHighlight from '@/components/ui/UiHighlight';
import { ExtensionNewProvider } from '@/context/extension-new.context';
import {
  useExtensionNewCtx,
  useExtensionNewStore,
} from '@/hooks/useExtensionNewStore';
import { useShallow } from 'zustand/react/shallow';
import APIService from '@/services/api.service';
import {
  ExtensionDetail,
  ExtensionDetailHeader,
  ExtensionDetailMarkdownAsset,
} from '@/components/extension/ExtensionDetail';

const BANNER_NAME_REGEX = /banner-[0-9]*.png/;
function ExtensionDetailTab() {
  const [repo, baseAssetURL, banners, manifest, updateState] =
    useExtensionNewStore(
      useShallow((state) => [
        state.repo,
        state.baseAssetURL,
        state.banners,
        state.manifest,
        state.updateState,
      ]),
    );
  const query = useQuery({
    refetchOnMount: false,
    refetchInterval: false,
    queryKey: ['contents-dist', repo.owner, repo.name],
    queryFn: () =>
      GithubAPI.instance.getRepoContents(repo.owner, repo.name, 'dist'),
  });

  useEffect(() => {
    const bannersFiles = Array.isArray(query.data)
      ? query.data
          .filter(
            (item) => item.type === 'file' && BANNER_NAME_REGEX.test(item.name),
          )
          .slice(0, 10)
      : [];
    if (bannersFiles.length > 0) {
      updateState(
        'banners',
        bannersFiles.map((file) => `${baseAssetURL}/${file.path}`),
      );
    }
  }, [query.data, baseAssetURL, updateState]);

  return (
    <ExtensionDetail
      banners={banners}
      sourceUrl={repo.url}
      commands={manifest.commands}
      categories={manifest.categories}
    />
  );
}

function ExtensionsNewHeader() {
  const [manifest, repo, getAssetURL] = useExtensionNewStore(
    useShallow((state) => [state.manifest, state.repo, state.getAssetURL]),
  );

  const dialog = useDialog();
  const { toast } = useToast();
  const navigate = useNavigate();
  const newExtStoreCtx = useExtensionNewCtx();

  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submitExtension() {
    try {
      setIsSubmitting(true);
      const confirmed = await dialog.confirm({
        okText: 'Submit',
        title: 'Submit extension',
        body: 'Submit the extension for review. The extension will be published once it is approved',
      });
      if (!confirmed) return;

      const { banners } = newExtStoreCtx.getState();
      const result = await APIService.instance.me.createExtension({
        banners,
        name: manifest.name,
        sourceUrl: repo.url,
        title: manifest.title,
        categories: manifest.categories,
        permissions: manifest.permissions,
        iconUrl: manifest.icon.startsWith('icon:')
          ? manifest.icon
          : getAssetURL(`/dist/icon/${manifest.icon}.png`),
        version: manifest.version,
        description: manifest.description,
        apiVersion: manifest.$apiVersion ?? '*',
        commands: manifest.commands.map((command) => ({
          name: command.name,
          type: command.type,
          title: command.title,
          description: command.description ?? '',
        })),
      });

      if (!result.success) {
        toast({
          variant: 'destructive',
          title: 'Error when submitting extension',
        });
        return;
      }

      navigate(`/devconsole/extensions/${result.data.extensionId}`);
    } catch (error) {
      console.error(error);
      toast({
        description: APIService.getErrorMessage(error, {
          404: 'Couldn\'t find the extension "manifest.json" file',
        }),
        variant: 'destructive',
        title: 'Error when submitting extension',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ExtensionDetailHeader
      className="mt-8"
      icon={manifest.icon}
      title={manifest.title}
      version={manifest.version}
      description={manifest.description}
      iconUrl={getAssetURL(`/dist/icon/${manifest.icon}.png`)}
      suffixSlot={
        <UiButtonLoader
          className="ml-4"
          isLoading={isSubmitting}
          onClick={submitExtension}
        >
          Submit
        </UiButtonLoader>
      }
    />
  );
}

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

function DevConsoleExtensionsNewPage() {
  const location = useLocation() as Location<ExtensionNewPayload>;
  const payload = extensionNewPayload.safeParse(location.state);

  if (!payload.success) {
    return <Navigate to="/devconsole/extensions" replace />;
  }

  const baseAssetUrl = GithubAPI.getRawURL(
    `${payload.data.repo.owner}/${payload.data.repo.name}/${payload.data.repo.branch}`,
  );

  return (
    <div className="container pt-28">
      <ExtensionNewProvider
        {...{ ...payload.data, baseAssetURL: baseAssetUrl }}
      >
        <UiBreadcrumb>
          <UiBreadcrumbList>
            <UiBreadcrumbItem>
              <UiBreadcrumbLink asChild>
                <Link to="/devconsole/extensions">Dev Console</Link>
              </UiBreadcrumbLink>
            </UiBreadcrumbItem>
            <UiBreadcrumbSeparator />
            <UiBreadcrumbItem>
              <UiBreadcrumbPage>New extension</UiBreadcrumbPage>
            </UiBreadcrumbItem>
          </UiBreadcrumbList>
        </UiBreadcrumb>
        <ExtensionsNewHeader />
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
            <ExtensionDetailTab />
          </UiTabsContent>
          <UiTabsContent value="manifest" className="pt-4">
            <div className="whitespace-pre-wrap rounded-lg border bg-card p-4 text-sm">
              <UiHighlight
                code={JSON.stringify(location.state.manifest, null, 4)}
              />
            </div>
          </UiTabsContent>
          <UiTabsContent value="readme" className="pt-4">
            <ExtensionDetailMarkdownAsset
              filename="README.md"
              assetUrl={baseAssetUrl + '/README.md'}
            />
          </UiTabsContent>
        </UiTabs>
      </ExtensionNewProvider>
    </div>
  );
}

export default DevConsoleExtensionsNewPage;
