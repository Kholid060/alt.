import { ExtensionNewPayload } from '@/routes/devconsole/extensions/new';
import APIService from '@/services/api.service';
import { useUserStore } from '@/stores/user.store';
import GithubAPI from '@/utils/GithubAPI';
import { ExtensionManifestSchema } from '@alt-dot/extension-core';
import { parseJSON } from '@alt-dot/shared';
import { useToast, UiDialog, UiLabel, UiInput, UiButton } from '@alt-dot/ui';
import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';

function DevConsoleNewExtension({ onClose }: { onClose?: () => void }) {
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
          title: 'Invalid manifest.json file',
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

      navigate({
        to: '/devconsole/extensions/new',
        // @ts-expect-error push extension data
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
            <p className="ml-1 text-sm text-destructive-text">{errorMessage}</p>
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

export default DevConsoleNewExtension;
