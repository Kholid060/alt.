import { commandIcons } from '#common/utils/command-icons';
import { memo, useCallback } from 'react';
import { useCommandStore } from '/@/stores/command.store';
import { APP_DEEP_LINK, CUSTOM_SCHEME } from '#common/utils/constant/constant';
import { UiImage, UiListItem, uiListItemsFilter } from '@repo/ui';
import { UiList } from '@repo/ui';
import {
  CommandListItemCommand,
  CommandListItemCommandBuiltIn,
  CommandListItemExtension,
  CommandListItems,
} from '/@/interface/command.interface';
import { useUiListStore } from '@repo/ui/dist/context/list.context';
import { ExtensionCommand } from '@repo/extension-core';
import preloadAPI from '/@/utils/preloadAPI';
import { BlocksIcon, LinkIcon, RotateCcwIcon } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useCommandPanelStore } from '/@/stores/command-panel.store';
import { useCommand } from '/@/hooks/useCommand';

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
  const [extensions, addExtension, updateExtension] = useCommandStore(
    useShallow((state) => [
      state.extensions,
      state.addExtension,
      state.updateExtension,
    ]),
  );

  const addPanelStatus = useCommandPanelStore.use.addStatus();

  const uiListStore = useUiListStore();
  const { executeCommand } = useCommand();

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

        return metadata.extensionId === cleanedQuery;
      });

      return commandItems;
    }

    return uiListItemsFilter(commandItems, cleanedQuery)
      .slice(0, 10)
      .map((item) => ({ ...item, group: 'Search results' }));
  }, []);

  function startExecuteCommand({
    command,
    extension,
  }: {
    command: ExtensionCommand;
    extension: { id: string; name: string };
  }) {
    const args: Record<string, unknown> = {};
    const commandStore = useCommandStore.getState();

    if (command.arguments && command.arguments.length > 0) {
      const argsValues =
        commandStore.commandArgs?.commandId === command.name
          ? commandStore.commandArgs.args
          : {};

      for (const arg of command.arguments) {
        if (arg.required && arg.type !== 'toggle' && !argsValues[arg.name]) {
          const element = document.querySelector<HTMLElement>(
            `[data-command-argument="${arg.name}"]`,
          );
          element?.focus();

          addPanelStatus({
            type: 'error',
            timeout: 5000,
            name: 'command-missing-args',
            title: 'Fill out the required fill before running the command',
          });

          return;
        }

        if (Object.hasOwn(argsValues, arg.name)) {
          args[arg.name] = argsValues[arg.name];
        }
      }

      commandStore.setCommandArgs(
        {
          args: {},
          commandId: '',
        },
        true,
      );
    }

    executeCommand({
      args,
      command,
      extensionId: extension.id,
      extensionName: extension.name,
    });
  }

  const extensionCommands = extensions.reduce<
    (CommandListItemCommand | CommandListItemExtension)[]
  >((acc, extension) => {
    const extensionIcon = (
      <CommandPrefix
        alt={`${extension.manifest.title} icon`}
        id={extension.id}
        icon={extension.manifest.icon}
      />
    );

    const item: CommandListItemExtension = {
      value: extension.id,
      group: 'Extensions',
      icon: extensionIcon,
      title: extension.manifest.title,
      metadata: {
        type: 'extension',
        extensionId: extension.id,
      },
      onSelected: () =>
        uiListStore.setState(
          'search',
          `${QUERY_PREFIX.EXT}${item.metadata.extensionId}`,
        ),
      suffix: extension.isLocal ? (
        <span className="text-xs text-muted-foreground">Local Extension</span>
      ) : undefined,
      actions: extension.isLocal
        ? [
            {
              icon: RotateCcwIcon,
              async onAction() {
                try {
                  const result = await preloadAPI.main.invokeIpcMessage(
                    'extension:reload',
                    extension.id,
                  );
                  if (!result) return;

                  if ('$isError' in result) {
                    addPanelStatus({
                      type: 'error',
                      title: 'Error!',
                      description: result.message,
                    });
                    return;
                  }

                  updateExtension(extension.id, result);
                } catch (error) {
                  console.error(error);
                }
              },
              title: 'Reload extension',
              value: 'reload-extension',
              shortcut: { key: 'r', mod1: 'mod', mod2: 'shiftKey' },
            },
          ]
        : [],
    };
    acc.push(item);

    extension.manifest.commands.forEach((command) => {
      acc.unshift({
        metadata: {
          command,
          type: 'command',
          extensionId: extension.id,
          extensionTitle: extension.manifest.title,
        },
        value: `command:${extension.id}:${command.name}`,
        onSelected: () =>
          startExecuteCommand({
            command,
            extension: { id: extension.id, name: extension.manifest.title },
          }),
        subtitle: command.subtitle || extension.manifest.title,
        suffix:
          command.type === 'script' ? (
            <span className="text-xs text-muted-foreground">
              Command Script
            </span>
          ) : undefined,
        icon: command.icon ? (
          <CommandPrefix
            id={extension.id}
            alt={command.name}
            icon={command.icon}
          />
        ) : (
          extensionIcon
        ),
        actions: [
          {
            onAction() {
              preloadAPI.main
                .invokeIpcMessage(
                  'clipboard:copy',
                  `${APP_DEEP_LINK}://extensions/${extension.id}/${command.name}`,
                )
                .then((value) => {
                  if (value && '$isError' in value) return;

                  addPanelStatus({
                    type: 'success',
                    title: 'Copied to clipboard',
                  });
                });
            },
            icon: LinkIcon,
            title: 'Copy Deep Link',
            value: 'copy-deeplink',
          },
        ],
        group: 'Commands',
        title: command.title,
        keywords: [extension.manifest.title],
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
        const result =
          await preloadAPI.main.invokeIpcMessage('extension:import');
        if (!result) return;

        if ('$isError' in result) {
          addPanelStatus({
            type: 'error',
            title: 'Error!',
            description: result.message,
          });
          return;
        }

        addExtension(result);
      },
      metadata: { type: 'builtin-command' },
    },
  ];

  return (
    <>
      <UiList
        className="p-2"
        items={[...extensionCommands, ...builtInCommands]}
        customFilter={customListFilter}
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
