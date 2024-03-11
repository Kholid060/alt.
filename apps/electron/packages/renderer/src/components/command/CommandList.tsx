import { commandIcons } from '#common/utils/command-icons';
import { memo, useCallback, useEffect, useState } from 'react';
import { useCommandStore } from '/@/stores/command.store';
import { CUSTOM_SCHEME } from '#common/utils/constant/constant';
import { UiImage, UiListItem, uiListItemsFilter } from '@repo/ui';
import { useShallow } from 'zustand/react/shallow';
import { UiList } from '@repo/ui';
import { CommandListMetadata } from '/@/interface/command.interface';
import { useCommandCtx } from '/@/hooks/useCommandCtx';
import { useUiListStore } from '@repo/ui/dist/context/list.context';
import { ToggleLeft } from 'lucide-react';

type CommandIconName = keyof typeof commandIcons;

const iconPrefix = 'icon:';

const QUERY_PREFIX = {
  EXT: 'ext:',
};

function CommandPrefix({
  id,
  icon,
  alt,
}: {
  icon: string;
  alt: string;
  id: string;
}) {
  if (icon.startsWith(iconPrefix)) {
    let iconName = icon.slice(iconPrefix.length) as CommandIconName;
    iconName = commandIcons[iconName] ? iconName : 'Command';

    const Icon = commandIcons[iconName] ?? icon;

    return <UiList.Icon icon={Icon} />;
  }

  return (
    <UiImage
      src={`${CUSTOM_SCHEME.extension}://${id}/icon/${icon}`}
      alt={alt}
    />
  );
}

function CommandList() {
  const uiListStore = useUiListStore();
  const extensions = useCommandStore(useShallow((state) => state.extensions));

  const [items, setItems] = useState<UiListItem<CommandListMetadata>[]>([]);

  const { executeCommand } = useCommandCtx();

  const customListFilter = useCallback((items: UiListItem[], query: string) => {
    let cleanedQuery = query;
    let commandItems = items;

    if (
      query.startsWith(QUERY_PREFIX.EXT) &&
      query.length > QUERY_PREFIX.EXT.length + 2
    ) {
      cleanedQuery = query.slice(QUERY_PREFIX.EXT.length);
      commandItems = commandItems.filter((item) => {
        const metadata = item.metadata as CommandListMetadata;
        if (metadata.type !== 'command') return false;

        return metadata.extensionId === cleanedQuery;
      });

      return commandItems;
    }

    return uiListItemsFilter(commandItems, cleanedQuery)
      .slice(0, 10)
      .map((item) => ({ ...item, group: 'Search results' }));
  }, []);
  const onItemSelected = useCallback(
    (item: UiListItem<CommandListMetadata>) => {
      if (!item.metadata?.type) return;

      switch (item.metadata.type) {
        case 'command':
          executeCommand({
            command: item.metadata.command,
            extension: {
              id: item.metadata.extensionId,
              name: item.metadata.extensionTitle,
            },
          });
          break;
        case 'extension':
          uiListStore.setState(
            'search',
            `${QUERY_PREFIX.EXT}${item.metadata.extensionId}`,
          );
          break;
      }
    },
    [],
  );

  useEffect(() => {
    const extensionItems: UiListItem<CommandListMetadata>[] = [];

    extensions.forEach(({ id, manifest }) => {
      const extensionIcon = (
        <CommandPrefix
          alt={`${manifest.title} icon`}
          id={id}
          icon={manifest.icon}
        />
      );

      const item: UiListItem<CommandListMetadata> = {
        value: id,
        group: 'Extensions',
        icon: extensionIcon,
        title: manifest.title,
        actions: [
          {
            icon: ToggleLeft,
            title: 'Disable',
            shortcut: {
              key: 'x',
              mod1: 'ctrlKey',
            },
            onAction() {
              console.log('hello!');
            },
            value: 'toggle-disable-extension',
          },
        ],
        metadata: {
          extensionId: id,
          type: 'extension',
        },
      };
      extensionItems.push(item);

      const commands: UiListItem<CommandListMetadata>[] = manifest.commands.map(
        (command) => {
          return {
            metadata: {
              command,
              type: 'command',
              extensionId: id,
              extensionTitle: manifest.title,
            },
            value: `command:${id}:${command.name}`,
            subtitle: command.subtitle || manifest.title,
            icon: command.icon ? (
              <CommandPrefix id={id} alt={command.name} icon={command.icon} />
            ) : (
              extensionIcon
            ),
            group: 'Commands',
            title: command.title,
            keywords: [manifest.title],
          };
        },
      );

      extensionItems.push(...commands);
    });

    setItems([...extensionItems]);
  }, [extensions]);

  return (
    <>
      <UiList
        className="p-2"
        items={items}
        customFilter={customListFilter}
        onItemSelected={onItemSelected}
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
