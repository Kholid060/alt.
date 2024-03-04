import { commandIcons } from '#common/utils/command-icons';
import { memo, useEffect, useMemo, useState } from 'react';
import { useCommandStore } from '/@/stores/command.store';
import { CUSTOM_SCHEME } from '#common/utils/constant/constant';
import { UiImage, UiListGroupItem, UiListItem, UiListItems } from '@repo/ui';
import { useShallow } from 'zustand/react/shallow';
import emitter from '/@/lib/mitt';
import { UiList } from '@repo/ui';

type CommandIconName = keyof typeof commandIcons;

const iconPrefix = 'icon:';

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
  const [extensions, selectedExt, setStoreState] = useCommandStore(
    useShallow((state) => [state.extensions, state.paths[0], state.setState]),
  );

  const [items, setItems] = useState<UiListItems>([]);

  useEffect(() => {
    const extensionItems: UiListItem[] = [];

    extensions.forEach(({ id, manifest }) => {
      const extensionIcon = (
        <CommandPrefix
          alt={`${manifest.title} icon`}
          id={id}
          icon={manifest.icon}
        />
      );

      const item: UiListItem = {
        value: id,
        icon: extensionIcon,
        title: manifest.title,
        subtitle: manifest.description,
        onSelected() {
          setStoreState('paths', [
            { id, label: manifest.title, type: 'extension' },
          ]);
        },
      };
      extensionItems.push(item);

      const commands: UiListItem[] = manifest.commands.map((command) => ({
        value: `command:${id}:${command.name}`,
        subtitle: command.subtitle,
        icon: command.icon ? (
          <CommandPrefix id={id} alt={command.name} icon={command.icon} />
        ) : (
          extensionIcon
        ),
        searchOnly: true,
        title: command.title,
        onSelected() {
          if (command.type === 'action') {
            emitter.emit('execute-command', {
              extensionId: id,
              commandId: command.name,
            });
            return;
          }

          setStoreState('paths', [
            { id, label: manifest.title, type: 'extension' },
            {
              id: command.name,
              label: command.title,
              type: 'command',
              meta: { type: command.type },
            },
          ]);
        },
      }));

      extensionItems.push(...commands);
    });

    setItems([
      { label: 'Extensions', value: 'extensions', items: extensionItems },
      {
        label: 'Keywords',
        items: [
          {
            title: 'Math',
            value: 'math',
            subtitle: 'Do math',
            icon: <UiList.Icon icon="?" />,
          },
        ],
      },
    ]);
  }, [extensions]);

  const filteredItems = useMemo(() => {
    if (selectedExt) {
      const extensions = items.find(
        (item) => item.value === 'extensions',
      ) as UiListGroupItem;
      if (!extensions) return [];

      return extensions.items.reduce<UiListItem[]>((acc, item) => {
        if (item.value.startsWith(`command:${selectedExt.id}`)) {
          acc.push({ ...item, searchOnly: false });
        }

        return acc;
      }, []);
    }

    return items;
  }, [items, selectedExt]);

  return <UiList items={filteredItems} />;
}

export default memo(CommandList);
