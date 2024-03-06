import { commandIcons } from '#common/utils/command-icons';
import { memo, useEffect, useMemo, useState } from 'react';
import { useCommandStore } from '/@/stores/command.store';
import { CUSTOM_SCHEME } from '#common/utils/constant/constant';
import {
  UiImage,
  UiListGroupItem,
  UiListItem,
  UiListItems,
  useToast,
} from '@repo/ui';
import { useShallow } from 'zustand/react/shallow';
import emitter from '/@/lib/mitt';
import { UiList } from '@repo/ui';
import { useCommandRouteStore } from '/@/stores/command-route.store';
import { ExtensionCommand } from '@repo/extension-core';
import { useCommandCtx } from '/@/hooks/useCommandCtx';

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

export type CommandListItemMetadata =
  | { type: 'extension'; extensionId: string }
  | {
      type: 'extension-command';
      extensionId: string;
      extensionLabel: string;
      command: ExtensionCommand;
    };

function CommandList() {
  const [extensions] = useCommandStore(
    useShallow((state) => [state.extensions, state.setState]),
  );
  const [parsedPath, navigate] = useCommandRouteStore(
    useShallow((state) => [state.parsedPath, state.navigate]),
  );

  const { toast } = useToast();
  const commandCtx = useCommandCtx();

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
        metadata: {
          extensionId: id,
          type: 'extension',
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
        metadata: {
          command,
          extensionId: id,
          type: 'extension-command',
          extensionLabel: manifest.title,
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
    const extensionId = parsedPath.params?.extensionId;
    if (extensionId) {
      const extensions = items.find(
        (item) => item.value === 'extensions',
      ) as UiListGroupItem;
      if (!extensions) return [];

      return extensions.items.reduce<UiListItem[]>((acc, item) => {
        if (item.value.startsWith(`command:${extensionId}`)) {
          acc.push({ ...item, searchOnly: false });
        }

        return acc;
      }, []);
    }

    return items;
  }, [items, parsedPath.params]);

  function executeCommand({
    command,
    extensionId,
    extensionLabel,
  }: Extract<CommandListItemMetadata, { type: 'extension-command' }>) {
    const args: Record<string, unknown> = {};

    if (command.arguments && command.arguments.length > 0) {
      const commandArgs = commandCtx.extCommandArgs.current;
      const argsValues =
        commandArgs?.commandId === command.name ? commandArgs.args : {};

      for (const arg of command.arguments) {
        if (arg.required && arg.type !== 'toggle' && !argsValues[arg.name]) {
          const element = document.querySelector<HTMLElement>(
            `[data-command-argument="${arg.name}"]`,
          );
          element?.focus();

          toast({
            duration: 5000,
            title: 'Fill out the field',
            className: 'text-sm max-w-xs p-3 right-2 leading-tight',
            description:
              'Fill out the required fill before running the command',
          });

          return;
        }

        if (Object.hasOwn(argsValues, arg.name)) {
          args[arg.name] = argsValues[arg.name];
        }
      }

      commandCtx.setExtCommandArgs(
        {
          args: {},
          commandId: '',
        },
        true,
      );
    }

    if (command.type === 'view') {
      navigate(`/extensions/${extensionId}/${command.name}/view`, {
        breadcrumbs: [
          { label: extensionLabel, path: '' },
          { label: command.title, path: `/extensions/${extensionId}` },
        ],
        data: args,
      });
      return;
    }

    emitter.emit('execute-command', {
      args,
      extensionId,
      commandId: command.name,
    });
  }
  function onItemSelected(item: UiListItem) {
    const metadata = item.metadata as CommandListItemMetadata;
    if (!metadata) return;

    switch (metadata.type) {
      case 'extension':
        navigate(`/extensions/${metadata.extensionId}`, {
          breadcrumbs: [{ label: item.title, path: '' }],
        });
        break;
      case 'extension-command': {
        executeCommand(metadata);
        break;
      }
    }
  }

  return (
    <UiList
      className="p-2"
      items={filteredItems}
      onItemSelected={onItemSelected}
    />
  );
}

export default memo(CommandList);
