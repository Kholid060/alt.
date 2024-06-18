import APIService from '@/services/api.service';
import GithubAPI from '@/utils/GithubAPI';
import { useUserStore } from '@/stores/user.store';
import { ExtensionManifestSchema } from '@alt-dot/extension-core';
import { parseJSON } from '@alt-dot/shared';
import {
  UiButton,
  UiDialog,
  UiDropdownMenu,
  UiDropdownMenuContent,
  UiDropdownMenuItem,
  UiDropdownMenuTrigger,
  UiInput,
  UiLabel,
  UiTabs,
  UiTabsList,
  UiTabsTrigger,
  useToast,
} from '@alt-dot/ui';
import { BlocksIcon, PlusIcon, WorkflowIcon } from 'lucide-react';
import { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ExtensionNewPayload } from './extensions/ExtensionsNewPage';

function NewExtension({ onClose }: { onClose?: () => void }) {
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

      const manifestFile = await GithubAPI.instance.getRepoContents(
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
        console.dir(manifest.error);
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

      const extensionExists = await APIService.instance.me.extensionExists(
        manifest.data.name,
      );
      if (extensionExists) {
        toast({
          variant: 'destructive',
          title: 'Extension exists',
          description: 'This extension is already been added',
        });
        return;
      }

      navigate('extensions/new', {
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
      toast({
        variant: 'destructive',
        title: APIService.getErrorMessage(error, {
          404: 'Couldn\'t find the extension "manifest.json" file',
        }),
      });

      console.error(error);
    } finally {
      setErrorMessage('');
    }
  }

  return (
    <UiDialog open onOpenChange={(value) => !value && onClose?.()}>
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

function NewWorkflow({ onClose }: { onClose?: () => void }) {
  return (
    <UiDialog open onOpenChange={(value) => !value && onClose?.()}>
      <UiDialog.Content className="sm:max-w-[425px]">
        <UiDialog.Header>
          <UiDialog.Title>Share workflow</UiDialog.Title>
          <UiDialog.Description>
            Share your workflow to the store
          </UiDialog.Description>
        </UiDialog.Header>
        <UiDialog.Footer className="mt-6">
          <UiButton className="min-w-24" type="submit">
            Continue
          </UiButton>
        </UiDialog.Footer>
      </UiDialog.Content>
    </UiDialog>
  );
}

function AddItem() {
  const [activeItem, setActiveItem] = useState<'extension' | 'workflow' | null>(
    null,
  );

  return (
    <>
      <UiDropdownMenu>
        <UiDropdownMenuTrigger asChild>
          <UiButton>
            <PlusIcon className="size-5 mr-2 -ml-0.5" />
            Item
          </UiButton>
        </UiDropdownMenuTrigger>
        <UiDropdownMenuContent className="w-40" align="end">
          <UiDropdownMenuItem onClick={() => setActiveItem('extension')}>
            <BlocksIcon className="mr-2 size-4" />
            Extension
          </UiDropdownMenuItem>
          <UiDropdownMenuItem onClick={() => setActiveItem('workflow')}>
            <WorkflowIcon className="mr-2 size-4" />
            Workflow
          </UiDropdownMenuItem>
        </UiDropdownMenuContent>
      </UiDropdownMenu>
      {activeItem === 'extension' ? (
        <NewExtension onClose={() => setActiveItem(null)} />
      ) : activeItem === 'workflow' ? (
        <NewWorkflow onClose={() => setActiveItem(null)} />
      ) : null}
    </>
  );
}

const rootPaths = ['/devconsole/extensions', '/devconsole/workflows'];
function DevConsoleLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  if (!rootPaths.includes(location.pathname)) {
    return <Outlet />;
  }

  return (
    <div className="pt-36 container">
      <h2 className="text-2xl font-semibold cursor-default leading-tight -mt-0.5">
        Dev Console
      </h2>
      <div className="mt-8 flex items-center justify-between">
        <UiTabs
          value={location.pathname}
          onValueChange={(value) => navigate(value, { replace: true })}
        >
          <UiTabsList>
            <UiTabsTrigger value="/devconsole/extensions">
              Extensions
            </UiTabsTrigger>
            <UiTabsTrigger value="/devconsole/workflows">
              Workflows
            </UiTabsTrigger>
          </UiTabsList>
        </UiTabs>
        <AddItem />
      </div>
      <div className="mt-4">
        <Outlet />
      </div>
    </div>
  );
}

export default DevConsoleLayout;
