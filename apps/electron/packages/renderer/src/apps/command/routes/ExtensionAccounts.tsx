import { UiList, UiListItem } from '@altdot/ui';
import { useDatabaseQuery } from '/@/hooks/useDatabase';
import { LogOutIcon, UserRoundIcon } from 'lucide-react';
import { useCommandPanelHeader } from '/@/hooks/useCommandPanelHeader';
import { useEffect } from 'react';
import preloadAPI from '/@/utils/preloadAPI';
import { useUiListStore } from '@altdot/ui/dist/context/list.context';
import UiExtensionIcon from '/@/components/ui/UiExtensionIcon';
import { SetRequired } from 'type-fest';
import { useCommandPanelStore } from '/@/stores/command-panel.store';

type UiListItemProcess = SetRequired<
  UiListItem<'command' | 'workflow'>,
  'metadata'
>;

function ExtensionAccounts() {
  useCommandPanelHeader({
    title: 'Connected Accounts',
    icon: <UserRoundIcon className="mr-2 h-5 w-5" />,
  });

  const uiListStore = useUiListStore();
  const addPanelStatus = useCommandPanelStore.use.addStatus();

  const workflowQuery = useDatabaseQuery(
    'database:get-oauth-tokens-account-list',
    [],
    {
      transform(data): UiListItemProcess[] {
        if (!data) return [];

        return data.map((item) => ({
          metadata: 'workflow',
          value: item.id,
          title: item.providerName,
          subtitle: item.extension.title,
          actions: [
            {
              icon: LogOutIcon,
              value: 'logout',
              color: 'destructive',
              title: 'Log out account',
              onAction() {
                preloadAPI.main.ipc
                  .invoke('database:delete-extension-oauth-token', item.id)
                  .then(() => {
                    addPanelStatus({
                      type: 'success',
                      title: 'Account logged out',
                    });
                  });
              },
            },
          ],
          icon: (
            <UiExtensionIcon
              alt={`${item.providerName} icon`}
              id={item.extensionId}
              icon={item.providerIcon}
              iconWrapper={(icon) => <UiList.Icon icon={icon} />}
            />
          ),
        }));
      },
    },
  );

  useEffect(() => {
    uiListStore.setState('search', '');
  }, [uiListStore]);

  return (
    <UiList
      className="p-2"
      items={workflowQuery.data ?? []}
      noDataSlot={
        <p className="my-4 text-center text-sm text-muted-foreground">
          No connected accounts
        </p>
      }
    />
  );
}

export default ExtensionAccounts;
