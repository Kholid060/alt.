import {
  UiTooltip,
  UiButton,
  UiDialog,
  UiList,
  UiAvatar,
  UiAvatarFallback,
  UiAvatarImage,
  UiButtonLoader,
  useToast,
} from '@altdot/ui';
import {
  BlocksIcon,
  DownloadIcon,
  StoreIcon,
  UserRoundIcon,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import preloadAPI from '/@/utils/preloadAPI';
import { ApiExtensionHighlightItem } from '@altdot/shared';
import UiExtensionIcon from '../../ui/UiExtensionIcon';
import WebURL from '#packages/common/utils/WebURL';
import { useDatabaseCtx } from '/@/hooks/useDatabase';
import { useWorkflowEditor } from '/@/hooks/useWorkflowEditor';

function WorkflowEditorMissingExtension() {
  const [missingExtensions, setMissingExtensions] = useState<
    ApiExtensionHighlightItem[]
  >([]);
  const [installing, setInstalling] = useState<string[]>([]);

  const { toast } = useToast();
  const databaseCtx = useDatabaseCtx();
  const workflowEditor = useWorkflowEditor();

  async function installExtension(extensions: ApiExtensionHighlightItem[]) {
    const filteredExtensions = extensions.filter(
      (extension) => !installing.includes(extension.id),
    );
    if (filteredExtensions.length === 0) return;

    const extensionIds = filteredExtensions.map((extension) => extension.id);
    setInstalling([...installing, ...extensionIds]);

    for (const extension of filteredExtensions) {
      try {
        await preloadAPI.main.ipc.invokeWithError(
          'extension:install',
          extension.id,
        );

        setMissingExtensions(
          missingExtensions.filter((item) => item.id !== extension.id),
        );
        workflowEditor.event.emit(
          'node-command:exists-changed',
          { extensionId: extension.id },
          true,
        );
      } catch (error) {
        console.error(error);
        toast({
          variant: 'destructive',
          title: 'Error installing extensoin',
          description: `Error when installing "${extension.title}" extension`,
        });
      }
    }

    setInstalling(installing.filter((extId) => !extensionIds.includes(extId)));
  }

  useEffect(() => {
    const onMissingExtension = async (extensionIds: string[]) => {
      try {
        if (extensionIds.length === 0) return;

        const extensions = await preloadAPI.main.ipc.invokeWithError(
          'extension:fetch-extension-highlight',
          extensionIds,
        );
        setMissingExtensions((prevValue) => [...prevValue, ...extensions]);
      } catch (error) {
        console.error(error);
      }
    };
    workflowEditor.event.on(
      'node-command:missing-extension',
      onMissingExtension,
    );

    const onExtensionChanged = (extensionId: string) => {
      preloadAPI.main.ipc
        .invokeWithError('database:get-extension', extensionId)
        .then((extension) => {
          if (!extension) {
            workflowEditor.event.emit(
              'node-command:exists-changed',
              {
                extensionId,
              },
              false,
            );
            onMissingExtension([extensionId]);
            return;
          }

          const commandIds = extension.commands.map(
            (command) => `${extensionId}:${command.name}`,
          );
          workflowEditor.event.emit(
            'node-command:exists-changed',
            {
              commandId: commandIds,
            },
            true,
          );
          setMissingExtensions((prevValue) =>
            prevValue.filter((extension) => extension.id !== extensionId),
          );
        });
    };
    databaseCtx.emitter.on('database:get-extension', onExtensionChanged);

    return () => {
      databaseCtx.emitter.off('database:get-extension', onExtensionChanged);
      workflowEditor.event.off(
        'node-command:missing-extension',
        onMissingExtension,
      );
    };
  }, [databaseCtx.emitter, workflowEditor.event]);

  if (missingExtensions.length === 0) return null;

  return (
    <div className="rounded-md border border-border/60 bg-secondary">
      <UiDialog modal>
        <UiDialog.Trigger asChild>
          <UiButton variant="ghost" className="relative">
            <BlocksIcon className="size-5" />
            <span className="ml-1">Missing extension(s)</span>
            <span className="pointer-events-none absolute -left-2 -top-2 inline-flex size-5 items-center justify-center rounded-full bg-primary p-1 text-xs">
              {missingExtensions.length}
            </span>
          </UiButton>
        </UiDialog.Trigger>
        <UiDialog.Content blurBg={false} className="block max-w-xl gap-0 p-0">
          <UiDialog.Header className="px-6 pt-6">
            <UiDialog.Title>Missing extensions</UiDialog.Title>
          </UiDialog.Header>
          <ul
            className="space-y-1 overflow-auto px-4 py-6"
            style={{ maxHeight: 'calc(100vh - 15rem)' }}
          >
            {missingExtensions.map((extension) => (
              <li
                className="group flex items-center rounded-md p-2 text-sm hover:bg-card"
                key={extension.id}
              >
                <div className="size-12">
                  <UiExtensionIcon
                    alt={`${extension.title} icon`}
                    id={extension.id}
                    extensionIcon={false}
                    icon={extension.iconUrl}
                    iconWrapper={(icon) => <UiList.Icon icon={icon} />}
                  />
                </div>
                <div className="mx-4 grow">
                  <p className="line-clamp-1 font-semibold leading-tight">
                    {extension.title}
                  </p>
                  <p
                    title={extension.description}
                    className="text mb-0.5 line-clamp-1 leading-tight text-muted-foreground"
                  >
                    {extension.description}
                  </p>
                  <a
                    href={WebURL.profilePage(extension.owner.username!)}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <UiAvatar className="inline-block size-4 align-middle">
                      {extension.owner.avatarUrl && (
                        <UiAvatarImage src={extension.owner.avatarUrl} />
                      )}
                      <UiAvatarFallback>
                        <UserRoundIcon className="size-4" />
                      </UiAvatarFallback>
                    </UiAvatar>
                    <span className="ml-1.5 align-middle">
                      {extension.owner.name}
                    </span>
                  </a>
                </div>
                <UiTooltip label="Open extension's store page">
                  <UiButton
                    asChild
                    size="icon-sm"
                    variant="ghost"
                    className="invisible group-hover:visible"
                  >
                    <a
                      href={WebURL.storeExtension(extension.name, extension.id)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <StoreIcon className="size-5" />
                    </a>
                  </UiButton>
                </UiTooltip>
                <UiTooltip label="Install extension">
                  <UiButtonLoader
                    size="icon-sm"
                    variant="ghost"
                    isLoading={installing.includes(extension.id)}
                    onClick={() => installExtension([extension])}
                    className="invisible ml-1 group-hover:visible"
                  >
                    <DownloadIcon className="size-5" />
                  </UiButtonLoader>
                </UiTooltip>
              </li>
            ))}
          </ul>
          <UiDialog.Footer className="px-6 pb-6">
            <UiButtonLoader
              isLoading={installing.length !== 0}
              onClick={() => installExtension(missingExtensions)}
            >
              Install all
            </UiButtonLoader>
          </UiDialog.Footer>
        </UiDialog.Content>
      </UiDialog>
    </div>
  );
}

export default WorkflowEditorMissingExtension;
