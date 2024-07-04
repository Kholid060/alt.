import { useEffect, useMemo, useState } from 'react';
import { useDatabase, useDatabaseQuery } from '/@/hooks/useDatabase';
import { useDebounceValue } from 'usehooks-ts';
import {
  ArrowDownAzIcon,
  ArrowUpAzIcon,
  EllipsisVerticalIcon,
  LinkIcon,
  Loader2Icon,
  PlusIcon,
  SearchIcon,
} from 'lucide-react';
import {
  UiButton,
  UiCard,
  UiCardContent,
  UiCardFooter,
  UiCardHeader,
  UiDialog,
  UiDropdownMenu,
  UiDropdownMenuContent,
  UiDropdownMenuItem,
  UiDropdownMenuSeparator,
  UiDropdownMenuTrigger,
  UiInput,
  UiLabel,
  UiList,
  UiListItem,
  UiSelect,
  UiTooltip,
  useDialog,
  useToast,
} from '@alt-dot/ui';
import {
  UiListProvider,
  useUiListStore,
} from '@alt-dot/ui/dist/context/list.context';
import UiExtensionIcon from '/@/components/ui/UiExtensionIcon';
import { ExtensionCredential } from '@alt-dot/extension-core/src/client/manifest/manifest-credential';
import CredentialDetail from '/@/components/credential/CredentialDetail';
import UiItemsPagination from '/@/components/ui/UiItemsPagination';
import preloadAPI from '/@/utils/preloadAPI';
import { isIPCEventError } from '#packages/common/utils/helper';
import dayjs from '/@/lib/dayjs';
import {
  ExtensionCredentialListPaginationItemModel,
  ExtensionListPaginationPayload,
} from '#packages/main/src/extension/extension-credential/extension-credential.interface';

type CredentialProviders = Record<
  string,
  {
    items: Record<string, ExtensionCredential & { connected: boolean }>;
    id: string;
    title: string;
  }
>;

interface CredentialDetailProps {
  credential: ExtensionCredential;
  extension: { id: string; title: string };
}
function AddCredentials({ providers }: { providers: CredentialProviders }) {
  const listStore = useUiListStore();

  const [open, setOpen] = useState(false);
  const [credential, setCredential] = useState<CredentialDetailProps | null>(
    null,
  );

  const credentials = useMemo(() => {
    const listItems: UiListItem<CredentialDetailProps>[] = [];

    for (const extensionId in providers) {
      const extension = providers[extensionId];
      for (const credentialId in extension.items) {
        const credential = extension.items[credentialId];
        if (credential.connected) continue;

        listItems.push({
          icon: (
            <UiExtensionIcon
              id={extension.id}
              alt={credential.providerName}
              icon={credential.providerIcon}
            />
          ),
          title: credential.providerName,
          metadata: { credential, extension },
          group: `${extension.title} extension`,
          value: `${extension.id}:${credential.providerId}`,
        });
      }
    }

    return listItems;
  }, [providers]);

  function onItemSelected(value: string) {
    const item = credentials.find((item) => item.value === value);
    if (!item?.metadata) return;

    setCredential(item.metadata);
  }

  useEffect(() => {
    if (!open) setCredential(null);
  }, [open]);

  return (
    <UiDialog open={open} onOpenChange={setOpen}>
      <UiDialog.Trigger asChild>
        <UiButton>
          <PlusIcon className="mr-2 h-5 w-5" />
          Credential
        </UiButton>
      </UiDialog.Trigger>
      <UiDialog.Content>
        {credential ? (
          <CredentialDetail
            onClose={() => setOpen(false)}
            extension={credential.extension}
            credential={credential.credential}
          />
        ) : (
          <>
            <UiDialog.Header>
              <UiDialog.Title>Add credential</UiDialog.Title>
            </UiDialog.Header>
            <div>
              <UiLabel className="ml-1" htmlFor="app-search">
                Select an app
              </UiLabel>
              <UiInput
                onKeyDown={(event) =>
                  listStore.listControllerKeyBind(event.nativeEvent)
                }
                onValueChange={(value) => listStore.setState('search', value)}
                placeholder="Search apps..."
                id="app-search"
              />
            </div>
            <UiList items={credentials} onItemSelected={onItemSelected} />
            {credentials.length === 0 && (
              <p className="text-center text-muted-foreground">
                No available apps
              </p>
            )}
          </>
        )}
      </UiDialog.Content>
    </UiDialog>
  );
}

function EditCredential({
  onClose,
  providers,
  credential,
}: {
  onClose?(): void;
  providers: CredentialProviders;
  credential: ExtensionCredentialListPaginationItemModel;
}) {
  const [open, setOpen] = useState(true);

  const data = useDatabaseQuery(
    'database:get-extension-credential-list-detail',
    [credential.id, true],
  );
  const provider =
    providers[credential.extension.id].items[credential.providerId];

  useEffect(() => {
    if (!open && onClose) onClose();
  }, [open, onClose]);

  return (
    <UiDialog open={open} onOpenChange={setOpen}>
      <UiDialog.Content>
        {data.data && provider ? (
          <CredentialDetail
            isEditing
            credential={provider}
            credentialId={credential.id}
            onClose={() => setOpen(false)}
            defaultValues={data.data.value}
            extension={credential.extension}
          />
        ) : (
          <div className="text-center">
            <Loader2Icon className="inline h-5 w-5 animate-spin" />
          </div>
        )}
      </UiDialog.Content>
    </UiDialog>
  );
}

function CredentialCard({
  onEdit,
  onDelete,
  onConnect,
  providers,
  credential,
}: {
  providers: CredentialProviders;
  credential: ExtensionCredentialListPaginationItemModel;
  onEdit?(item: ExtensionCredentialListPaginationItemModel): void;
  onDelete?(item: ExtensionCredentialListPaginationItemModel): void;
  onConnect?(item: ExtensionCredentialListPaginationItemModel): void;
}) {
  const provider =
    providers[credential.extension.id].items[credential.providerId];
  if (!provider) return null;

  return (
    <UiCard>
      <UiCardHeader className="flex-row items-center justify-between space-y-0 p-4">
        <div className="h-9 w-9">
          <UiExtensionIcon
            id={credential.extension.id}
            alt={provider.providerName}
            icon={provider.providerIcon}
          />
        </div>
        {credential.tokenId !== null ? (
          <div className="relative flex items-center">
            <div className="relative flex h-9 cursor-default items-center rounded-md rounded-r-none bg-secondary px-3 text-sm text-green-500">
              Connected
              <hr className="absolute right-0 h-6 w-px bg-border" />
            </div>
            <UiTooltip label="Reconnect account">
              <UiButton
                size="icon-sm"
                variant="secondary"
                className="rounded-l-none"
                onClick={() => onConnect?.(credential)}
              >
                <LinkIcon className="h-4 w-4" />
              </UiButton>
            </UiTooltip>
          </div>
        ) : (
          <UiButton
            variant="secondary"
            size="sm"
            onClick={() => onConnect?.(credential)}
          >
            Connect
          </UiButton>
        )}
      </UiCardHeader>
      <UiCardContent
        onClick={() => onEdit?.(credential)}
        className="cursor-pointer px-4 pb-4 text-sm text-muted-foreground"
      >
        <p className="line-clamp-1 text-base text-foreground">
          {credential.name}
        </p>
        <p>
          {provider.providerName} • {credential.extension.title} extension
        </p>
      </UiCardContent>
      <UiCardFooter className="px-4 pb-4 text-sm">
        <div className="flex-grow">
          <p className="text-muted-foreground">
            Updated {dayjs(credential.updatedAt).fromNow()}
          </p>
        </div>
        <UiDropdownMenu>
          <UiDropdownMenuTrigger asChild>
            <button className="focus:outline-none" tabIndex={-1}>
              <EllipsisVerticalIcon className="h-5 w-5" />
            </button>
          </UiDropdownMenuTrigger>
          <UiDropdownMenuContent>
            <UiDropdownMenuItem onClick={() => onEdit?.(credential)}>
              Open
            </UiDropdownMenuItem>
            {provider.documentationUrl && (
              <UiDropdownMenuItem
                onClick={() =>
                  preloadAPI.main.ipc.invoke(
                    'shell:open-url',
                    provider.documentationUrl!,
                  )
                }
              >
                Documentation
              </UiDropdownMenuItem>
            )}
            <UiDropdownMenuSeparator />
            <UiDropdownMenuItem
              variant="destructive"
              onClick={() => onDelete?.(credential)}
            >
              Delete
            </UiDropdownMenuItem>
          </UiDropdownMenuContent>
        </UiDropdownMenu>
      </UiCardFooter>
    </UiCard>
  );
}

type CredentialSort = Required<
  Required<ExtensionListPaginationPayload>['sort']
>;
function RouteCredentials() {
  const dialog = useDialog();
  const { toast } = useToast();
  const { queryDatabase } = useDatabase();

  const [credentials, setCredentials] = useState<{
    count: number;
    isFetched: boolean;
    items: ExtensionCredentialListPaginationItemModel[];
  }>({ count: 0, items: [], isFetched: false });
  const [editCredential, setEditCredential] =
    useState<ExtensionCredentialListPaginationItemModel | null>(null);

  const [search, setSearch] = useDebounceValue('', 250);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
  });
  const [sort, setSort] = useState<CredentialSort>({
    asc: false,
    by: 'createdAt',
  });

  const credentialProvidersQuery = useDatabaseQuery(
    'database:get-extension-creds',
    [],
  );

  const credentialProviders = useMemo<CredentialProviders>(() => {
    if (!credentialProvidersQuery.data || !credentials.isFetched) return {};

    const inputtedCredential = new Set<string>();
    credentials.items.forEach((item) => {
      if (item.tokenId === null) return;

      inputtedCredential.add(`${item.extension.id}:${item.providerId}`);
    });

    const providers: CredentialProviders = {};
    credentialProvidersQuery.data.forEach((extension) => {
      if (!extension.credentials || extension.credentials.length === 0) return;

      if (!providers[extension.id]) {
        providers[extension.id] = {
          items: {},
          id: extension.id,
          title: extension.title,
        };
      }

      extension.credentials?.forEach((provider) => {
        providers[extension.id].items[provider.providerId] = {
          ...provider,
          connected: inputtedCredential.has(
            `${extension.id}:${provider.providerId}`,
          ),
        };
      });
    });

    return providers;
  }, [credentialProvidersQuery.data, credentials]);

  async function onDeleteCredential(
    credential: ExtensionCredentialListPaginationItemModel,
  ) {
    try {
      const isConfirmed = await dialog.confirm({
        title: 'Delete credential',
        body: (
          <>
            Are you sure you want to delete the{' '}
            <b>&quot;{credential.name}&quot;</b> credential?
          </>
        ),
        okText: 'Delete',
        okButtonVariant: 'destructive',
      });
      if (!isConfirmed) return;

      const result = await preloadAPI.main.ipc.invoke(
        'database:delete-extension-credential',
        credential.id,
      );
      if (isIPCEventError(result)) {
        toast({
          title: 'Error!',
          variant: 'destructive',
          description: result.message,
        });
      }
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Something went wrong',
      });
    }
  }
  async function onConnectCredential(
    credential: ExtensionCredentialListPaginationItemModel,
  ) {
    try {
      const result = await preloadAPI.main.ipc.invoke(
        'oauth:connect-account',
        credential.id,
      );
      if (isIPCEventError(result)) {
        toast({
          title: 'Error!',
          variant: 'destructive',
          description: result.message,
        });
      }
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Something went wrong',
      });
    }
  }

  useEffect(
    () =>
      queryDatabase({
        args: [
          {
            sort,
            pagination,
            filter: { name: search.trim() || undefined },
          },
        ],
        name: 'database:get-extension-credential-list',
        onData(data) {
          setCredentials({
            ...data,
            isFetched: true,
          });
        },
        onError(message) {
          console.error(message);
        },
      }),
    [queryDatabase, search, sort, pagination],
  );

  return (
    <div className="container p-8">
      <h2 className="-mt-0.5 text-2xl font-semibold leading-tight">
        Credentials
      </h2>
      <div className="mt-8 flex items-center">
        <UiInput
          type="search"
          defaultValue={search}
          placeholder="Search..."
          onValueChange={setSearch}
          prefixIcon={<SearchIcon className="h-5 w-5" />}
        />
        <div className="ml-4 flex items-center rounded-md border text-sm">
          <UiButton
            variant="outline"
            size="icon"
            className="flex-shrink-0 border-0"
            onClick={() =>
              setSort((prevVal) => ({ ...prevVal, asc: !prevVal.asc }))
            }
          >
            {sort.asc ? (
              <ArrowDownAzIcon className="h-5 w-5" />
            ) : (
              <ArrowUpAzIcon className="h-5 w-5" />
            )}
          </UiButton>
          <hr className="h-6 w-px bg-border" />
          <UiSelect
            value={sort.by}
            className="border-0 bg-background px-2"
            placeholder="Sort by"
            onValueChange={(value) =>
              setSort((prevValue) => ({
                ...prevValue,
                by: value as CredentialSort['by'],
              }))
            }
          >
            <UiSelect.Option value="name">Name</UiSelect.Option>
            <UiSelect.Option value="createdAt">Created date</UiSelect.Option>
            <UiSelect.Option value="updatedAt">Updated date</UiSelect.Option>
          </UiSelect>
        </div>
        <div className="flex-grow"></div>
        <UiListProvider>
          <AddCredentials providers={credentialProviders} />
        </UiListProvider>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {credentials.items.map((cred) => (
          <CredentialCard
            key={cred.id}
            credential={cred}
            onEdit={setEditCredential}
            onDelete={onDeleteCredential}
            onConnect={onConnectCredential}
            providers={credentialProviders}
          />
        ))}
      </div>
      {credentials.count === 0 && (
        <p className="my-4 text-center text-muted-foreground">No data</p>
      )}
      <UiItemsPagination
        pagination={pagination}
        itemsCount={credentials.count}
        onPaginationChange={setPagination}
      />
      {editCredential && (
        <EditCredential
          credential={editCredential}
          providers={credentialProviders}
          onClose={() => setEditCredential(null)}
        />
      )}
    </div>
  );
}

export default RouteCredentials;
