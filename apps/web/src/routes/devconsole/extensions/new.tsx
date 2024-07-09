import {
  ExtensionDetail,
  ExtensionDetailHeader,
  ExtensionDetailMarkdownAsset,
} from '@/components/extension/ExtensionDetail';
import UiHighlight from '@/components/ui/UiHighlight';
import { ExtensionNewProvider } from '@/context/extension-new.context';
import {
  useExtensionNewStore,
  useExtensionNewCtx,
} from '@/hooks/useExtensionNewStore';
import APIService from '@/services/api.service';
import GithubAPI from '@/utils/GithubAPI';
import { ExtensionManifest } from '@altdot/extension';
import { isObject } from '@altdot/shared';
import {
  useDialog,
  useToast,
  UiButtonLoader,
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
} from '@altdot/ui';
import {
  Link,
  createFileRoute,
  redirect,
  useNavigate,
} from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { z } from 'zod';
import { useShallow } from 'zustand/react/shallow';

export const Route = createFileRoute('/devconsole/extensions/new')({
  component: DevConsoleExtensionsNewPage,
  async loader({ location }) {
    const payload = await extensionNewPayload.safeParseAsync(location.state);
    if (!payload.success) {
      throw redirect({
        replace: true,
        to: '/devconsole/extensions',
      });
    }

    return payload.data;
  },
});

function ExtensionDetailTab() {
  const [repo, banners, manifest, updateState] = useExtensionNewStore(
    useShallow((state) => [
      state.repo,
      state.banners,
      state.manifest,
      state.updateState,
    ]),
  );

  useEffect(() => {
    GithubAPI.instance
      .getExtBanners(repo.owner, repo.name)
      .then((result) => updateState('banners', result));
  }, []);

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
        relativePath: `/${repo.branch}`,
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

      navigate({
        to: `/devconsole/extensions/${result.data.extensionId}`,
        replace: true,
      });
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
  const payload = Route.useLoaderData();

  const baseAssetUrl = GithubAPI.getRawURL(
    `${payload.repo.owner}/${payload.repo.name}/${payload.repo.branch}`,
  );

  return (
    <div className="container pt-28">
      <ExtensionNewProvider {...{ ...payload, baseAssetURL: baseAssetUrl }}>
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
              <UiHighlight code={JSON.stringify(payload.manifest, null, 4)} />
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
