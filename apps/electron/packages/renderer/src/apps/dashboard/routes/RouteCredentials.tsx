import { useEffect, useMemo, useState } from 'react';
import { useDatabase, useDatabaseQuery } from '/@/hooks/useDatabase';
import {
  DatabaseExtensionCredentialsValueList,
  DatabaseExtensionCredentialsValueListOptions,
} from '#packages/main/src/interface/database.interface';
import { useDebounceValue } from 'usehooks-ts';
import {
  ArrowDownAzIcon,
  ArrowUpAzIcon,
  EllipsisVerticalIcon,
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
  useDialog,
  useToast,
} from '@repo/ui';
import {
  UiListProvider,
  useUiListStore,
} from '@repo/ui/dist/context/list.context';
import UiExtensionIcon from '/@/components/ui/UiExtensionIcon';
import { ExtensionCredential } from '@repo/extension-core/src/client/manifest/manifest-credential';
import CredentialDetail from '/@/components/credential/CredentialDetail';
import UiItemsPagination from '/@/components/ui/UiItemsPagination';
import { ArrayValues } from 'type-fest';
import preloadAPI from '/@/utils/preloadAPI';
import { isIPCEventError } from '#packages/common/utils/helper';
import dayjs from '/@/lib/dayjs';

type CredentialProviders = Record<
  string,
  { items: Record<string, ExtensionCredential>; id: string; title: string }
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
          <PlusIcon className="h-5 w-5 mr-2" />
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
  credential: ExtensionCredentialListItem;
}) {
  const [open, setOpen] = useState(true);

  const data = useDatabaseQuery('database:get-extension-creds-value-detail', [
    credential.id,
    true,
  ]);
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
            <Loader2Icon className="h-5 w-5 animate-spin inline" />
          </div>
        )}
      </UiDialog.Content>
    </UiDialog>
  );
}

type ExtensionCredentialListItem =
  ArrayValues<DatabaseExtensionCredentialsValueList>;
function CredentialCard({
  onEdit,
  onDelete,
  providers,
  credential,
}: {
  providers: CredentialProviders;
  credential: ExtensionCredentialListItem;
  onEdit?(item: ExtensionCredentialListItem): void;
  onDelete?(item: ExtensionCredentialListItem): void;
}) {
  const provider =
    providers[credential.extension.id].items[credential.providerId];
  if (!provider) return null;

  return (
    <UiCard>
      <UiCardHeader className="items-center flex-row p-4 space-y-0 justify-between">
        <div className="h-9 w-9">
          <UiExtensionIcon
            id={credential.extension.id}
            alt={provider.providerName}
            icon={provider.providerIcon}
          />
        </div>
        <UiButton variant="secondary">Connect</UiButton>
      </UiCardHeader>
      <UiCardContent
        onClick={() => onEdit?.(credential)}
        className="pb-4 px-4 text-sm text-muted-foreground cursor-pointer"
      >
        <p className="text-base text-foreground line-clamp-1">
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
            <UiButton variant="ghost" size="icon-sm">
              <EllipsisVerticalIcon className="h-5 w-5" />
            </UiButton>
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
  Required<DatabaseExtensionCredentialsValueListOptions>['sort']
>;
function RouteCredentials() {
  const dialog = useDialog();
  const { toast } = useToast();
  const { queryDatabase } = useDatabase();

  const [credentials, setCredentials] = useState<{
    count: number;
    items: DatabaseExtensionCredentialsValueList;
  }>({ count: 0, items: [] });
  const [editCredential, setEditCredential] =
    useState<ExtensionCredentialListItem | null>(null);

  const [search, setSearch] = useDebounceValue('', 250);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
  });
  const [sort, setSort] = useState<CredentialSort>({
    asc: false,
    by: 'createdAt',
  });

  const credentialProviders = useDatabaseQuery(
    'database:get-extension-creds',
    [],
    {
      transform(data) {
        if (!data) return {};

        const providers: CredentialProviders = {};
        data.forEach((extension) => {
          if (!extension.credentials || extension.credentials.length === 0)
            return;

          if (!providers[extension.id]) {
            providers[extension.id] = {
              items: {},
              id: extension.id,
              title: extension.title,
            };
          }

          extension.credentials?.forEach((provider) => {
            providers[extension.id].items[provider.providerId] = provider;
          });
        });

        return providers;
      },
    },
  );

  async function onDeleteCredential(credential: ExtensionCredentialListItem) {
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

  useEffect(() => {
    queryDatabase({
      args: [
        {
          sort,
          pagination,
          filter: { name: search.trim() || undefined },
        },
      ],
      name: 'database:get-extension-creds-value',
      onData(data) {
        setCredentials(data);
      },
      onError(message) {
        console.error(message);
      },
    });
  }, [queryDatabase, search, sort, pagination]);

  return (
    <div className="p-8 container">
      <h2 className="text-2xl font-semibold leading-tight -mt-0.5">
        Credentials
      </h2>
      <div className="flex items-center mt-8">
        <UiInput
          type="search"
          defaultValue={search}
          placeholder="Search..."
          onValueChange={setSearch}
          prefixIcon={<SearchIcon className="h-5 w-5" />}
        />
        <div className="flex items-center ml-4 rounded-md border text-sm">
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
          <AddCredentials providers={credentialProviders.data ?? {}} />
        </UiListProvider>
      </div>
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
        {credentials.items.map((cred) => (
          <CredentialCard
            key={cred.id}
            credential={cred}
            onEdit={setEditCredential}
            onDelete={onDeleteCredential}
            providers={credentialProviders.data ?? {}}
          />
        ))}
      </div>
      {credentials.count === 0 && (
        <p className="text-muted-foreground text-center my-4">No data</p>
      )}
      <UiItemsPagination
        pagination={pagination}
        itemsCount={credentials.count}
        onPaginationChange={setPagination}
      />
      {editCredential && (
        <EditCredential
          credential={editCredential}
          onClose={() => setEditCredential(null)}
          providers={credentialProviders.data ?? {}}
        />
      )}
    </div>
  );
}

export default RouteCredentials;
