import {
  ExtensionDetailIcon,
  ExtensionDetailMarkdownAsset,
} from '@/components/extension/ExtensionDetail';
import {
  ExtensionStoreDetail,
  ExtensionPermissions,
  ExtensionCommand,
} from '@/interface/extension.interface';
import APIService from '@/services/api.service';
import GithubAPI from '@/utils/GithubAPI';
import { APP_TITLE, EXTENSION_COMMAND_TYPE_NAME } from '@/utils/constant';
import {
  UiAvatar,
  UiAvatarImage,
  UiAvatarFallback,
  UiButton,
  UiScrollArea,
  UiTabs,
  UiTabsList,
  UiTabsTrigger,
  UiTabsContent,
  UiSkeleton,
} from '@altdot/ui';
import { Link, createFileRoute, redirect } from '@tanstack/react-router';
import githubLogoWhiteSvg from '@/assets/logo/github-white.svg';
import { UserRoundIcon, ShareIcon } from 'lucide-react';
import dayjs from '@/lib/dayjs';
import { useNativeApp } from '@/hooks/useNativeApp';
import { Helmet } from 'react-helmet-async';

function queryData(extensionId: string) {
  return {
    queryKey: ['store-extensions:detail', extensionId],
    queryFn: () => APIService.instance.store.getExtension(extensionId),
  };
}

export const Route = createFileRoute(
  '/store/extensions/$extensionName/$extensionId',
)({
  component: StoreExtensionsDetailPage,
  pendingComponent: () => (
    <div className="container pt-36">
      <div className="md:flex md:items-center">
        <UiSkeleton className="size-16" />
        <div className="mt-4 md:ml-4 md:mt-0 md:flex-grow">
          <UiSkeleton className="h-7 w-48" />
          <UiSkeleton className="mt-2 h-5 w-24" />
        </div>
        <div className="mt-4 flex w-full max-w-md items-center md:mt-0 md:w-auto">
          <UiSkeleton className="h-10 w-24 flex-grow md:flex-auto" />
          <UiSkeleton className="ml-2 size-10" />
        </div>
      </div>
      <hr className="my-8" />
      <div className="lg:flex lg:flex-row lg:items-start">
        <UiSkeleton className="h-96 flex-1" />
        <UiSkeleton className="mt-4 h-52 w-72 lg:ml-12 lg:mt-0" />
      </div>
    </div>
  ),
  async loader({ params, context }) {
    const { extensionId, extensionName } = params;

    const result = await context.queryClient
      .ensureQueryData(queryData(extensionId))
      .then((data) => ({
        ...data,
        baseAssetURL: new URL(data.sourceUrl).pathname + data.relativePath,
      }));
    if (result.name !== extensionName) {
      throw redirect({
        to: `/store/extensions/${result.name}/${extensionId}`,
      });
    }

    return result;
  },
});

const numberFormatter = new Intl.NumberFormat();

function ExtensionPageHeader({
  extension,
}: {
  extension: ExtensionStoreDetail;
}) {
  const { installExtension } = useNativeApp();

  return (
    <div className="flex flex-col items-start md:flex-row md:items-center">
      <ExtensionDetailIcon
        svgClass="size-16"
        imageClass="h-[82px] w-[82px] rounded-lg"
        title={extension.title}
        icon={extension.iconUrl}
        iconUrl={extension.iconUrl}
      />
      <div className="mt-2 flex-grow md:ml-4 md:mr-4 md:mt-0">
        <h3 className="text-lg font-semibold">{extension.title}</h3>
        <p className="line-clamp-2 text-sm text-muted-foreground">
          {extension.description}
        </p>
        <div className="mt-2">
          <Link
            to={`/u/${extension.owner.username}`}
            className="line-clamp-1 inline text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <UiAvatar className="inline-block size-4 align-middle">
              {extension.owner.avatarUrl && (
                <UiAvatarImage src={extension.owner.avatarUrl} />
              )}
              <UiAvatarFallback>
                <UserRoundIcon className="size-4" />
              </UiAvatarFallback>
            </UiAvatar>
            <span className="ml-1.5 align-middle">{extension.owner.name}</span>
          </Link>
        </div>
      </div>
      <div className="mt-4 flex w-full max-w-md items-center md:w-auto">
        <UiButton
          className="flex-1 md:flex-auto"
          onClick={() => installExtension(extension.id)}
        >
          Install extension
        </UiButton>
        <UiButton
          size="icon"
          variant="secondary"
          className="ml-2"
          onClick={() => navigator.share({ url: window.location.href })}
        >
          <ShareIcon className="size-5" />
        </UiButton>
      </div>
    </div>
  );
}

function ExtensionPageBanner({
  extension,
}: {
  extension: ExtensionStoreDetail;
}) {
  if (extension.banners.length === 0) return null;

  return (
    <UiScrollArea orientation="horizontal" className="mt-6 pb-3">
      <div className="flex items-center gap-4">
        {extension.banners.map((banner, index) => (
          <div
            key={banner}
            className="relative aspect-video h-64 flex-shrink-0 snap-start overflow-hidden rounded-lg"
          >
            <img
              src={banner}
              loading="lazy"
              alt={`${extension.title} banner ${index + 1}`}
              className="h-full w-full object-cover object-center"
            />
          </div>
        ))}
      </div>
    </UiScrollArea>
  );
}

function getPermissionsDescription(
  permissions: ExtensionPermissions[],
  commands: ExtensionCommand[],
) {
  const permissionDetail: Record<
    string,
    { description: string; permissions: string[] }
  > = {};
  const addPermission = ({
    key,
    permission,
    description,
    excludeIfHas,
  }: {
    key: string;
    description: string;
    permission: string;
    excludeIfHas?: ExtensionPermissions;
  }) => {
    if (excludeIfHas && permissionDetail[excludeIfHas]) return;

    if (!permissionDetail[key]) {
      permissionDetail[key] = {
        description,
        permissions: [],
      };
    }

    permissionDetail[key].permissions.push(permission);
  };

  commands.forEach((command) => {
    if (command.type !== 'script') return;

    addPermission({
      key: 'script',
      description: 'Execute script file',
      permission: `${command.name} file`,
    });
  });

  const sortedPermissions = permissions.sort(
    (a, z) => a.split('.').length - z.split('.').length,
  );
  sortedPermissions.forEach((permission) => {
    switch (permission) {
      case 'clipboard':
        addPermission({
          permission,
          key: permission,
          description: 'Read and write the clipboard data',
        });
        break;
      case 'notifications':
        addPermission({
          permission,
          key: permission,
          description: 'Display notification',
        });
        break;
      case 'fs.read':
        addPermission({
          permission,
          key: permission,
          excludeIfHas: 'fs',
          description: 'Read your local file',
        });
        break;

      case 'fs.write': {
        addPermission({
          permission,
          key: permission,
          excludeIfHas: 'fs',
          description: 'Write your local file',
        });
        break;
      }
      case 'fs':
        addPermission({
          permission,
          key: permission,
          description: 'Read and write your local file',
        });
        break;
      case 'browser.tabs':
        addPermission({
          permission,
          key: 'browser',
          description: 'Access the the browser tabs',
        });
        break;
    }
  });

  return Object.values(permissionDetail);
}

function StoreExtensionsDetailPage() {
  const extension = Route.useLoaderData();

  const permissions = getPermissionsDescription(
    extension.permissions ?? [],
    extension.commands,
  );

  return (
    <div className="container py-36">
      <Helmet>
        <title>
          {extension.title} extension ー {APP_TITLE} store
        </title>
        <meta name="description" content={extension.description} />
      </Helmet>
      <ExtensionPageHeader extension={extension} />
      <ExtensionPageBanner extension={extension} />
      <UiTabs variant="line" className="mt-6" defaultValue="readme">
        <UiTabsList className="h-11 overflow-auto">
          <UiTabsTrigger value="readme" className="min-w-24 flex-shrink-0">
            Readme
          </UiTabsTrigger>
          <UiTabsTrigger value="commands" className="min-w-24 flex-shrink-0">
            Commands
            <span className="leading-0 ml-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-secondary text-xs font-normal text-muted-foreground">
              {extension.commands.length}
            </span>
          </UiTabsTrigger>
          <UiTabsTrigger value="changelog" className="min-w-24 flex-shrink-0">
            Changelog
          </UiTabsTrigger>
        </UiTabsList>
        <div className="mt-6 lg:flex lg:items-start">
          <div className="flex-1">
            <UiTabsContent value="readme">
              <ExtensionDetailMarkdownAsset
                filename="README"
                assetUrl={GithubAPI.getRawURL(
                  extension.baseAssetURL + '/README.md',
                )}
              />
            </UiTabsContent>
            <UiTabsContent value="commands">
              <table>
                <tbody>
                  {extension.commands.map((command) => (
                    <tr key={command.name}>
                      <td className="py-2 pr-2 align-top">
                        <span className="whitespace-nowrap rounded-full border px-2 py-0.5 text-xs">
                          {EXTENSION_COMMAND_TYPE_NAME[command.type]}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <p className="leading-tight">{command.title}</p>
                        <p className="leading-tight text-muted-foreground">
                          {command.description}
                        </p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </UiTabsContent>
            <UiTabsContent value="changelog">
              <ExtensionDetailMarkdownAsset
                filename="CHANGELOG"
                assetUrl={GithubAPI.getRawURL(
                  extension.baseAssetURL + '/CHANGELOG.md',
                )}
              />
            </UiTabsContent>
          </div>
          <hr className="my-8 lg:hidden" />
          <div className="text-sm lg:ml-12 lg:w-72">
            <div className="grid max-w-xs flex-1 grid-cols-2 gap-x-2 gap-y-4 rounded-lg border p-4">
              <p className="text-muted-foreground">Downloads count</p>
              <p className="text-right">
                {numberFormatter.format(extension.downloadCount)}x
              </p>
              <p className="text-muted-foreground">Version</p>
              <p className="text-right">{extension.version}</p>
              <p className="text-muted-foreground">Last updated</p>
              <p className="text-right">
                {dayjs(extension.updatedAt).fromNow()}
              </p>
              <p className="text-muted-foreground">Source code</p>
              <p className="text-right">
                <a
                  href={extension.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:underline"
                >
                  <img
                    src={githubLogoWhiteSvg}
                    alt="GitHub logo"
                    className="mr-1 inline size-4 align-text-top"
                  />
                  View source
                </a>
              </p>
            </div>
            {extension.categories.length > 0 && (
              <div className="mt-4">
                <p className="font-semibold text-muted-foreground">
                  Categories
                </p>
                <div className="mt-1 flex flex-wrap gap-1 text-right">
                  {extension.categories.map((category) => (
                    <Link
                      key={category}
                      to={`/store/extensions?category=${category}`}
                      className="inline-flex items-center rounded-full border px-1.5 py-0.5 text-xs"
                    >
                      {category}
                    </Link>
                  ))}
                </div>
              </div>
            )}
            {permissions.length > 0 && (
              <div className="mt-4">
                <p className="font-semibold text-muted-foreground">
                  Permissions
                </p>
                <ul className="list mt-1 list-disc">
                  {permissions.map((permission, index) => (
                    <li key={index} className="ml-4">
                      {permission.description}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </UiTabs>
    </div>
  );
}
