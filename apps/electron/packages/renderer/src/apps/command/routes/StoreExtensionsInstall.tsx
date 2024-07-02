import { useCommandNavigate, useCommandRoute } from '/@/hooks/useCommandRoute';
import API from '#packages/common/utils/API';
import { useQuery } from '@tanstack/react-query';
import {
  UiAvatar,
  UiAvatarFallback,
  UiAvatarImage,
  UiButton,
  UiButtonLoader,
  UiImage,
  UiSkeleton,
} from '@alt-dot/ui';
import clsx from 'clsx';
import { useCommandPanelHeader } from '/@/hooks/useCommandPanelHeader';
import { BlocksIcon, CpuIcon, DownloadIcon, UserRoundIcon } from 'lucide-react';
import bugFixingSvg from '/@/assets/svg/bug-fixing.svg';
import githubWhiteLogoSvg from '/@/assets/svg/github-white.svg';
import preloadAPI from '/@/utils/preloadAPI';
import { useState } from 'react';
import { useCommandPanelStore } from '/@/stores/command-panel.store';
import { useDatabaseQuery } from '/@/hooks/useDatabase';
import { commandIcons } from '#packages/common/utils/command-icons';

function ExtensionIcon({
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
      commandIcons[icon.split(':')[1] as keyof typeof commandIcons] ??
      commandIcons.Command;

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

const numberFormatter = new Intl.NumberFormat();

function StoreExtensionsInstall() {
  const addStatusPanel = useCommandPanelStore.use.addStatus();

  useCommandPanelHeader({
    icon: <BlocksIcon className="size-5 mr-2" />,
    title: 'Install extension',
  });

  const navigate = useCommandNavigate();
  const extensionId = useCommandRoute(
    (state) => state.currentRoute.params.extensionId!,
  );

  const query = useQuery({
    refetchOnMount: false,
    refetchInterval: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    queryKey: ['store-extensions', extensionId],
    queryFn: () => API.store.getExtension(extensionId),
  });
  const existQuery = useDatabaseQuery('database:get-extension-exists', [
    extensionId,
  ]);

  const [installing, setInstalling] = useState(false);

  async function installExtension() {
    try {
      setInstalling(true);

      const extension = await preloadAPI.main.ipc.invokeWithError(
        'extension:install',
        extensionId,
      );
      if (!extension) return;

      preloadAPI.main.ipc.send('data:changes', 'extension');

      const inputExtensionConfig =
        !extension.isError && extension.config?.some((item) => item.required);
      navigate(inputExtensionConfig ? `/configs/${extension.id}` : '');
    } catch (error) {
      addStatusPanel({
        type: 'error',
        title: 'Something went wrong!',
        description: 'An error occured when installing extension',
      });
      console.error(error);
    } finally {
      setInstalling(false);
    }
  }

  return (
    <div className="py-4 px-5">
      {query.isPending ? (
        <>
          <div className="flex items-center">
            <UiSkeleton className="h-[82px] w-[82px] rounded-lg" />
            <div className="ml-4 flex-grow">
              <UiSkeleton className="h-8 w-44" />
              <UiSkeleton className="h-3 w-52 mt-2" />
              <UiSkeleton className="h-3 w-28 mt-4" />
            </div>
          </div>
          <div className="flex items-center mt-10 gap-4">
            <UiSkeleton className="h-4 w-24" />
            <UiSkeleton className="h-4 w-24" />
            <UiSkeleton className="h-4 w-24" />
            <div className="flex-grow"></div>
            <UiSkeleton className="h-10 w-40" />
          </div>
        </>
      ) : query.isError ? (
        <div className="flex flex-col items-center">
          <img src={bugFixingSvg} className="w-40" alt="error" />
          <p className="mb-6 font-semibold">Couldn&apos;t find extension</p>
        </div>
      ) : (
        <>
          <div className="flex items-center">
            <ExtensionIcon
              svgClass="size-16"
              imageClass="h-[82px] w-[82px] rounded-lg"
              icon={query.data.iconUrl}
              iconUrl={query.data.iconUrl}
              title={query.data.title + ' icon'}
            />
            <div className="flex-grow ml-4">
              <p className="font-semibold text-lg">{query.data.title}</p>
              <p className="text-muted-foreground leading-tight line-clamp-2 text-sm">
                {query.data.description}
              </p>
              <p className="text-sm mt-2 text-muted-foreground">
                <UiAvatar className="size-4 inline-block align-middle">
                  {query.data.owner.avatarUrl && (
                    <UiAvatarImage
                      loading="lazy"
                      src={query.data.owner.avatarUrl}
                    />
                  )}
                  <UiAvatarFallback>
                    <UserRoundIcon className="size-4" />
                  </UiAvatarFallback>
                </UiAvatar>
                <span className="align-middle ml-1.5">
                  {query.data.owner.name}
                </span>
              </p>
            </div>
          </div>
          <div className="flex items-center mt-9 text-muted-foreground text-sm">
            <span>
              <DownloadIcon className="size-5 inline align-middle" />
              <span className="align-middle ml-1">
                {numberFormatter.format(query.data.downloadCount)}x
              </span>
            </span>
            <span className="ml-6">
              <CpuIcon className="size-5 inline align-middle" />
              <span className="align-middle ml-1">
                {query.data.commands.length}
              </span>
            </span>
            <a
              className="ml-6 underline inline-flex items-center"
              href={query.data.sourceUrl}
              target="_blank"
              rel="noreferer noreferrer"
            >
              <img
                src={githubWhiteLogoSvg}
                className="size-4"
                alt="GitHub logo"
              />
              <span className="ml-1">View source</span>
            </a>
            <div className="flex-grow"></div>
            {existQuery.data ? (
              <UiButton disabled className="min-w-40" variant="secondary">
                Installed
              </UiButton>
            ) : (
              <UiButtonLoader
                className="min-w-40"
                isLoading={installing}
                onClick={installExtension}
              >
                Install
              </UiButtonLoader>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default StoreExtensionsInstall;
