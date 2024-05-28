import { useEffect, useState } from 'react';
import { useDatabase, useDatabaseQuery } from '/@/hooks/useDatabase';
import { DatabaseExtensionCredentials } from '#packages/main/src/interface/database.interface';
import { useDebounceValue } from 'usehooks-ts';
import { PlusIcon, SearchIcon } from 'lucide-react';
import {
  UiButton,
  UiDialog,
  UiImage,
  UiInput,
  UiLabel,
  UiList,
  UiListItem,
} from '@repo/ui';
import {
  UiListProvider,
  useUiListStore,
} from '@repo/ui/dist/context/list.context';
import UiExtensionIcon from '/@/components/ui/UiExtensionIcon';
import { ExtensionCredential } from '@repo/extension-core/src/client/manifest/manifest-credential';

interface CredentialDetailProps {
  credential: ExtensionCredential;
  extension: { id: string; title: string };
}
function CredentialDetail({
  extension,
  credential,
  ...props
}: CredentialDetailProps & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div {...props}>
      <div className="flex items-center">
        <div className="h-12 w-12 flex-shrink-0">
          <UiExtensionIcon
            id={extension.id}
            alt={credential.providerName}
            icon={credential.providerIcon}
          />
        </div>
        <div className="ml-2">
          <h2 className="text-lg font-semibold">{credential.providerName}</h2>
          <p className="text-muted-foreground text-sm leading-tight line-clamp-2">
            {extension.title} • {credential.description}
          </p>
        </div>
      </div>
      <form className="mt-4">
        <UiLabel className="ml-1" htmlFor="cred-name">
          Name
        </UiLabel>
        <UiInput
          id="cred-name"
          defaultValue={`[${extension.title}] ${credential.providerName} account`}
          placeholder={`[${extension.title}] ${credential.providerName} account`}
        />
        <UiLabel className="ml-1 mt-4 block" htmlFor="cred-callback-url">
          Callback URL
        </UiLabel>
        <UiInput
          id="cred-callback-url"
          readOnly
          onClick={(event) => (event.target as HTMLInputElement).select()}
          value="http://localhost:40401/oauth2/callback"
        />
      </form>
    </div>
  );
}

function AddCredentialsContent() {
  const listStore = useUiListStore();
  const credentials = useDatabaseQuery('database:get-extension-creds', [], {
    transform(data) {
      if (!data) return [];

      const credentials: UiListItem<CredentialDetailProps>[] = [];

      for (const extension of data) {
        for (const credential of extension.credentials ?? []) {
          credentials.push({
            icon: (
              <UiExtensionIcon
                id={extension.id}
                alt={credential.providerName}
                icon={credential.providerIcon}
              />
            ),
            title: credential.providerName,
            metadata: { credential, extension },
            subtitle: `${extension.title} extension`,
            value: `${extension.id}:${credential.providerId}`,
          });
        }
      }

      return credentials;
    },
  });

  const [credential, setCredential] = useState<CredentialDetailProps | null>(
    null,
  );

  function onItemSelected(value: string) {
    if (!credentials.data) return;

    const item = credentials.data.find((item) => item.value === value);
    if (!item?.metadata) return;

    setCredential(item.metadata);
  }

  return (
    <>
      {credential ? (
        <CredentialDetail
          className="mt-2"
          extension={credential.extension}
          credential={credential.credential}
        />
      ) : (
        <>
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
          <UiList
            items={credentials.data ?? []}
            onItemSelected={onItemSelected}
          />
        </>
      )}
    </>
  );
}

function RouteCredentials() {
  const { queryDatabase } = useDatabase();

  const [search, setSearch] = useDebounceValue('', 250);
  const [credentials, setCredentials] = useState<DatabaseExtensionCredentials>(
    [],
  );

  useEffect(() => {
    queryDatabase({
      name: 'database:get-extension-creds',
      args: [],
      autoRefreshOnChange: false,
      onData(data) {
        setCredentials(data);
      },
      onError(message) {
        console.error(message);
      },
    });
  }, [queryDatabase, search]);

  return (
    <div className="p-8 container">
      <h2 className="text-2xl font-semibold leading-tight -mt-0.5">
        Credentials
      </h2>
      <div className="flex items-center mt-8">
        <UiInput
          defaultValue={search}
          placeholder="Search..."
          prefixIcon={<SearchIcon className="h-5 w-5" />}
          onValueChange={setSearch}
        />
        <div className="flex-grow"></div>
        <UiDialog>
          <UiDialog.Trigger asChild>
            <UiButton>
              <PlusIcon className="h-5 w-5 mr-2" />
              Credential
            </UiButton>
          </UiDialog.Trigger>
          <UiDialog.Content>
            <UiDialog.Header>
              <UiDialog.Title>Add credential</UiDialog.Title>
            </UiDialog.Header>
            <UiListProvider>
              <AddCredentialsContent />
            </UiListProvider>
          </UiDialog.Content>
        </UiDialog>
      </div>
    </div>
  );
}

export default RouteCredentials;
