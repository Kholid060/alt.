import { useEffect, useMemo } from 'react';
import { useCommandPanelStore } from '/@/stores/command-panel.store';
import { SearchSlashIcon } from 'lucide-react';
import { UiList, UiListItem } from '@alt-dot/ui';
import { useDatabaseQuery } from '/@/hooks/useDatabase';
import UiExtensionIcon from '/@/components/ui/UiExtensionIcon';
import preloadAPI from '/@/utils/preloadAPI';
import { isIPCEventError } from '#packages/common/utils/helper';
import { useUiListStore } from '@alt-dot/ui/dist/context/list.context';

type CommandItem = UiListItem<{
  commandId: string;
  extensionId: string;
  isFallback: boolean;
}>;

function FallbackCommands() {
  const setPanelHeader = useCommandPanelStore.use.setHeader();
  const addPanelStatus = useCommandPanelStore.use.addStatus();
  const listStore = useUiListStore();

  const extensionQuery = useDatabaseQuery('database:get-extension-list', [], {
    disableAutoRefresh: true,
  });

  const extensionCommands = useMemo(() => {
    const fallbacks: CommandItem[] = [];
    const availableFallbacks: CommandItem[] = [];

    extensionQuery.data?.forEach((extension) => {
      const extensionIcon = extension.isError ? (
        <UiList.Icon icon={extension.title[0].toUpperCase()} />
      ) : (
        <UiExtensionIcon
          alt={`${extension.title} icon`}
          id={extension.id}
          icon={extension.icon}
          iconWrapper={(icon) => <UiList.Icon icon={icon} />}
        />
      );
      if (extension.isError || extension.isDisabled) return;

      extension.commands.forEach((command) => {
        const commandItem: CommandItem = {
          metadata: {
            commandId: command.name,
            extensionId: extension.id,
            isFallback: command.isFallback ?? false,
          },
          value: `command:${extension.id}:${command.name}`,
          subtitle: command.subtitle || extension.title,
          group: command.isFallback ? 'Fallbacks' : 'Available fallbacks',
          icon: command.icon ? (
            <UiExtensionIcon
              id={extension.id}
              alt={command.name}
              icon={command.icon}
              iconWrapper={(icon) => <UiList.Icon icon={icon} />}
            />
          ) : (
            extensionIcon
          ),
          title: command.title,
        };

        if (command.isFallback) fallbacks.push(commandItem);
        else availableFallbacks.push(commandItem);
      });
    });

    return fallbacks.concat(availableFallbacks);
  }, [extensionQuery]);

  async function onItemSelected(value: string) {
    const item = extensionCommands.find((command) => command.value === value);
    if (!item) return;

    try {
      const { commandId, extensionId, isFallback } = item.metadata!;
      const result = await preloadAPI.main.ipc.invoke(
        'database:update-extension-command',
        extensionId,
        commandId,
        {
          isFallback: !isFallback,
        },
      );
      if (isIPCEventError(result)) {
        addPanelStatus({
          type: 'error',
          title: 'Error!',
          description: result.message,
        });
        return;
      }

      extensionQuery.updateState((prevValue) =>
        prevValue.map((extension) => {
          if (extension.id !== extensionId) return extension;

          const commands = extension.commands.map((command) => {
            if (command.name !== commandId) return command;

            return {
              ...command,
              isFallback: !isFallback,
            };
          });

          return {
            ...extension,
            commands,
          };
        }),
      );
    } catch (error) {
      console.error(error);
      addPanelStatus({
        type: 'error',
        title: 'Something went wrong!',
      });
    }
  }

  useEffect(() => {
    listStore.setState('search', '');
    setPanelHeader({
      subtitle: 'Utils',
      title: 'Fallback Commands',
      icon: <SearchSlashIcon className="mr-2 h-4 w-4" />,
    });

    return () => {
      setPanelHeader(null);
    };
  }, [listStore, setPanelHeader]);

  return (
    <UiList
      className="p-2"
      items={extensionCommands}
      onItemSelected={onItemSelected}
    />
  );
}

export default FallbackCommands;
