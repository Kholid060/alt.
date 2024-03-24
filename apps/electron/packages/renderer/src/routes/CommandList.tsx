import { memo, useCallback } from 'react';
import { useCommandStore } from '/@/stores/command.store';
import {
  UiListItem,
  UiListRenderItemDetail,
  uiListItemsFilter,
} from '@repo/ui';
import { UiList } from '@repo/ui';
import {
  CommandListItemCommand,
  CommandListItemCommandBuiltIn,
  CommandListItemExtension,
  CommandListItems,
} from '/@/interface/command.interface';
import preloadAPI from '/@/utils/preloadAPI';
import { BlocksIcon } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useCommandPanelStore } from '/@/stores/command-panel.store';
import ListItemCommand from '../components/list-item/ListItemCommand';
import ListItemExtension from '../components/list-item/ListItemExtension';
import UiExtensionIcon from '../components/ui/UiExtensionIcon';
import { useCommandNavigate } from '../hooks/useCommandRoute';

const QUERY_PREFIX = {
  EXT: 'ext:',
};

export interface ListItemRenderDetail<
  T extends CommandListItems['metadata']['type'],
> extends Omit<UiListRenderItemDetail, 'ref'> {
  itemRef: UiListRenderItemDetail['ref'];
  item: Extract<CommandListItems, { metadata: { type: T } }>;
}

function CommandList() {
  const [extensions, addExtension] = useCommandStore(
    useShallow((state) => [state.extensions, state.addExtension]),
  );

  const addPanelStatus = useCommandPanelStore.use.addStatus();
  const navigate = useCommandNavigate();

  const customListFilter = useCallback((items: UiListItem[], query: string) => {
    let cleanedQuery = query;
    let commandItems = items;

    if (
      query.startsWith(QUERY_PREFIX.EXT) &&
      query.length > QUERY_PREFIX.EXT.length + 2
    ) {
      cleanedQuery = query.slice(QUERY_PREFIX.EXT.length);
      commandItems = commandItems.filter((item) => {
        const metadata = item.metadata as CommandListItems['metadata'];
        if (metadata.type !== 'command') return false;

        return metadata.extension.id === cleanedQuery;
      });

      return commandItems;
    }

    return uiListItemsFilter(commandItems, cleanedQuery)
      .slice(0, 10)
      .map((item) => ({ ...item, group: 'Search results' }));
  }, []);

  const extensionCommands = extensions.reduce<
    (CommandListItemCommand | CommandListItemExtension)[]
  >((acc, extension) => {
    const extensionIcon = extension.isError ? (
      <UiList.Icon icon={extension.title[0].toUpperCase()} />
    ) : (
      <UiExtensionIcon
        alt={`${extension.title} icon`}
        id={extension.id}
        icon={extension.manifest.icon}
        iconWrapper={(icon) => <UiList.Icon icon={icon} />}
      />
    );

    const item: CommandListItemExtension = {
      value: extension.id,
      group: 'Extensions',
      icon: extensionIcon,
      title: extension.title,
      metadata: {
        extension,
        type: 'extension',
      },
    };
    acc.push(item);

    if (extension.isError) return acc;

    const { manifest: _, ...extensionPayload } = extension;

    extension.manifest.commands.forEach((command) => {
      acc.unshift({
        metadata: {
          command,
          type: 'command',
          extension: extensionPayload,
          commandIcon: command.icon ?? extension.manifest.icon,
        },
        value: `command:${extension.id}:${command.name}`,
        subtitle: command.subtitle || extension.title,
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
        group: 'Commands',
        title: command.title,
        keywords: [extension.title],
      });
    });

    return acc;
  }, []);
  const builtInCommands: CommandListItemCommandBuiltIn[] = [
    {
      group: 'Commands',
      title: 'Import Extension',
      value: 'import-extension',
      icon: <UiList.Icon icon={BlocksIcon} />,
      async onSelected() {
        try {
          const result =
            await preloadAPI.main.invokeIpcMessage('extension:import');
          if (!result) return;

          if ('$isError' in result) {
            await preloadAPI.main.invokeIpcMessage('dialog:message-box', {
              type: 'error',
              message: `Error when trying to import extension:\n\n${result.message}`,
            });
            return;
          }

          addExtension(result);

          const inputExtensionConfig =
            !result.isError &&
            result.manifest.config?.some((item) => item.required);
          if (inputExtensionConfig) {
            navigate(`/configs/${result.id}`, {
              data: {
                config: result.manifest.config,
              },
              panelHeader: {
                title: result.title,
                icon: result.manifest.icon,
              },
            });
          }
        } catch (_error) {
          addPanelStatus({
            type: 'error',
            title: 'Error!',
            description: 'Something went wrong',
          });
        }
      },
      metadata: {
        type: 'builtin-command',
      },
    },
  ];

  return (
    <>
      <UiList
        className="p-2"
        items={[...extensionCommands, ...builtInCommands]}
        customFilter={customListFilter}
        renderItem={({ ref, item, ...detail }) => {
          const commandItem = item as CommandListItems;
          switch (commandItem.metadata.type) {
            case 'builtin-command':
              return (
                <UiList.Item
                  ref={ref}
                  selected={detail.selected}
                  {...{ ...detail.props, ...commandItem }}
                />
              );
            case 'command':
              return (
                <ListItemCommand
                  itemRef={ref}
                  item={commandItem as CommandListItemCommand}
                  {...{ ...detail }}
                />
              );
            case 'extension':
              return (
                <ListItemExtension
                  itemRef={ref}
                  item={commandItem as CommandListItemExtension}
                  {...{ ...detail }}
                />
              );
            default:
              return null;
          }
        }}
        renderGroupHeader={(label, index) => (
          <UiList.GroupHeading className={`${index !== 0 ? 'mt-1 block' : ''}`}>
            {label}
          </UiList.GroupHeading>
        )}
      />
    </>
  );
}

export default memo(CommandList);
