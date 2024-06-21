import {
  ExtensionDetailIcon,
  ExtensionDetailMarkdownAsset,
} from '@/components/extension/ExtensionDetail';
import { APIRouteLoaderFunc } from '@/interface/api.interface';
import {
  ExtensionCommand,
  ExtensionPermissions,
  ExtensionStoreDetail,
} from '@/interface/extension.interface';
import APIService from '@/services/api.service';
import GithubAPI from '@/utils/GithubAPI';
import { PageError } from '@/utils/custom-error';
import {
  UiAvatar,
  UiAvatarImage,
  UiAvatarFallback,
  UiButton,
  UiTabs,
  UiTabsList,
  UiTabsTrigger,
  UiTabsContent,
  UiScrollArea,
} from '@alt-dot/ui';
import { ShareIcon, UserRoundIcon } from 'lucide-react';
import {
  Link,
  redirect,
  useLoaderData,
  useSearchParams,
} from 'react-router-dom';
import dayjs from '@/lib/dayjs';
import { EXTENSION_COMMAND_TYPE_NAME } from '@/utils/constant';
import githubLogoWhiteSvg from '@/assets/logo/github-white.svg';
import { useMemo } from 'react';

function queryData(extensionId: string) {
  return {
    queryKey: ['store-extensions:detail', extensionId],
    queryFn: () => APIService.instance.store.getExtension(extensionId),
  };
}

const numberFormatter = new Intl.NumberFormat();

function ExtensionPageHeader({
  extension,
}: {
  extension: ExtensionStoreDetail;
}) {
  return (
    <div className="flex items-start md:items-center flex-col md:flex-row">
      <ExtensionDetailIcon
        svgClass="size-16"
        imageClass="h-[82px] w-[82px]"
        title={extension.title}
        icon={extension.iconUrl}
        iconUrl={extension.iconUrl}
      />
      <div className="flex-grow mt-2 md:mt-0 md:ml-4 md:mr-4">
        <h3 className="text-lg font-semibold">{extension.title}</h3>
        <p className="text-muted-foreground text-sm line-clamp-2">
          {extension.description}
        </p>
        <div className="mt-2">
          <Link
            to={`/u/${extension.owner.username}`}
            className="hover:text-foreground transition-colors line-clamp-1 text-muted-foreground text-sm"
          >
            <UiAvatar className="size-4 inline-block align-middle">
              {extension.owner.avatarUrl && (
                <UiAvatarImage src={extension.owner.avatarUrl} />
              )}
              <UiAvatarFallback>
                <UserRoundIcon className="size-4" />
              </UiAvatarFallback>
            </UiAvatar>
            <span className="align-middle ml-1.5">{extension.owner.name}</span>
          </Link>
        </div>
      </div>
      <div className="flex items-center w-full md:w-auto mt-4">
        <UiButton className="flex-1 md:flex-auto">Install extension</UiButton>
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
            className="flex-shrink-0 aspect-video h-64 rounded-lg overflow-hidden snap-start"
          >
            <img
              src={banner}
              alt={`${extension.title} banner ${index + 1}`}
              className="object-cover object-center h-full w-full"
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
      case 'browser.activeTab':
        addPermission({
          permission,
          key: 'browser',
          description: 'Access the active tab of a browser',
        });
        break;
    }
  });

  return Object.values(permissionDetail);
}

const validTabs = ['commands', 'readme', 'changelog'];
function StoreExtensionsDetailPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const extension = useLoaderData() as ExtensionStoreDetail;

  const permissions = useMemo(() => {
    return getPermissionsDescription(
      extension.permissions ?? [],
      extension.commands,
    );
  }, []);
  const defaultTab = searchParams.get('tab') ?? 'readme';

  return (
    <>
      <ExtensionPageHeader extension={extension} />
      <ExtensionPageBanner extension={extension} />
      <UiTabs
        variant="line"
        className="mt-6"
        defaultValue={validTabs.includes(defaultTab) ? defaultTab : 'readme'}
        onValueChange={(tab) => {
          setSearchParams({ tab }, { replace: true });
        }}
      >
        <UiTabsList className="overflow-auto h-11">
          <UiTabsTrigger value="readme" className="min-w-24 flex-shrink-0">
            Readme
          </UiTabsTrigger>
          <UiTabsTrigger value="commands" className="min-w-24 flex-shrink-0">
            Commands
            <span className="h-5 w-5 bg-secondary ml-1.5 inline-flex items-center justify-center text-muted-foreground leading-0 rounded-full text-xs font-normal">
              {extension.commands.length * 2}
            </span>
          </UiTabsTrigger>
          <UiTabsTrigger value="changelog" className="min-w-24 flex-shrink-0">
            Changelog
          </UiTabsTrigger>
        </UiTabsList>
        <div className="lg:flex lg:items-start mt-6">
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
                      <td className="align-top py-2 pr-2">
                        <span className="px-2 py-0.5 border rounded-full text-xs whitespace-nowrap">
                          {EXTENSION_COMMAND_TYPE_NAME[command.type]}
                        </span>
                      </td>
                      <td className="py-2 px-3">
                        <p className="leading-tight">{command.title}</p>
                        <p className="text-muted-foreground leading-tight">
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
          <div className="lg:w-72 lg:ml-12 text-sm">
            <div className="border rounded-lg p-4 grid grid-cols-2 gap-y-4 gap-x-2 max-w-xs flex-1">
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
                    className="size-4 inline align-text-top mr-1"
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
                <div className="text-right flex gap-1 flex-wrap mt-1">
                  {extension.categories.map((category) => (
                    <Link
                      key={category}
                      to={`/store/extensions?category=${category}`}
                      className="py-0.5 px-1.5 text-xs rounded-full border inline-flex items-center"
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
                <ul className="mt-1 list list-disc">
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
    </>
  );
}

export const storeExtensionsDetailPage: APIRouteLoaderFunc =
  (queryClient) =>
  async ({ params }) => {
    const { extensionId, extensionName } = params;
    if (!extensionId || !extensionName) {
      throw new PageError(404, { message: 'Extension Not Found' });
    }

    const result = await queryClient
      .fetchQuery(queryData(extensionId))
      .then((data) => ({
        ...data,
        baseAssetURL: new URL(data.sourceUrl).pathname + data.relativePath,
      }));
    if (result.name !== extensionName) {
      return redirect(`/store/extensions/${result.name}/${extensionId}`);
    }

    return result;
  };

export default StoreExtensionsDetailPage;
