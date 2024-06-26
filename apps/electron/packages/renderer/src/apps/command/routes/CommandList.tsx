import { memo, useCallback, useEffect, useMemo } from 'react';
import { useCommandStore } from '/@/stores/command.store';
import {
  UiListItem,
  UiListRenderItemDetail,
  uiListItemsFilter,
} from '@alt-dot/ui';
import { UiList } from '@alt-dot/ui';
import {
  CommandListItemCommand,
  CommandListItemCommandBuiltIn,
  CommandListItemExtension,
  CommandListItemWorkflow,
  CommandListItems,
} from '/@/interface/command.interface';
import preloadAPI from '/@/utils/preloadAPI';
import {
  BlocksIcon,
  CpuIcon,
  FileCodeIcon,
  KeyRoundIcon,
  SearchSlashIcon,
  SettingsIcon,
  WorkflowIcon,
} from 'lucide-react';
import { useCommandPanelStore } from '/@/stores/command-panel.store';
import ListItemCommand from '/@/components/list-item/ListItemCommand';
import UiExtensionIcon from '/@/components/ui/UiExtensionIcon';
import { useCommandNavigate } from '/@/hooks/useCommandRoute';
import { useDatabaseQuery } from '/@/hooks/useDatabase';
import ListItemWorkflow from '/@/components/list-item/ListItemWorkflow';
import ListItemExtension from '/@/components/list-item/ListItemExtension';
import { EXTENSION_BUILT_IN_ID } from '#packages/common/utils/constant/extension.const';
import { isIPCEventError } from '#packages/common/utils/helper';

const QUERY_PREFIX = {
  EXT: 'ext:',
};

export interface ListItemRenderDetail<
  T extends CommandListItems['metadata']['type'],
> extends Omit<UiListRenderItemDetail, 'ref'> {
  itemRef: UiListRenderItemDetail['ref'];
  item: Extract<CommandListItems, { metadata: { type: T } }>;
}

const dashboardPageCommands: CommandListItemCommandBuiltIn[] = (
  [
    { title: 'Extensions Page', icon: BlocksIcon, path: '/extensions' },
    { title: 'Workflows Page', icon: WorkflowIcon, path: '/workflows' },
    { title: 'Credentials Page', icon: KeyRoundIcon, path: '/credentials' },
    { title: 'Settings Page', icon: SettingsIcon, path: '/settings' },
  ] as const
).map((page) => ({
  title: page.title,
  group: 'Dashboard',
  subtitle: 'Dashboard',
  value: `dashboard:${page.path || ''}`,
  icon: <UiList.Icon icon={page.icon} />,
  async onSelected() {
    await preloadAPI.main.ipc.invoke('command-window:close');
    preloadAPI.main.ipc.send('dashboard-window:open', page.path);
  },
  metadata: {
    type: 'builtin-command',
  },
}));
const builtInExtensionIds: string[] = Object.values(EXTENSION_BUILT_IN_ID);

function CommandList() {
  const extensionQuery = useDatabaseQuery('database:get-extension-list', []);
  const workflowQuery = useDatabaseQuery('database:get-workflow-list', [
    'commands',
  ]);

  // const activeBrowserTab = useCommandStore.use.activeBrowserTab();
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
        if (metadata.type !== 'command' || !metadata.extension) return false;

        return metadata.extension.id === cleanedQuery;
      });

      return commandItems;
    }

    const result = uiListItemsFilter(commandItems, cleanedQuery)
      .slice(0, 10)
      .map((item) => ({ ...item, group: 'Search results' }));
    if (result.length === 0) {
      return commandItems.reduce<UiListItem[]>((acc, command) => {
        if (command.metadata?.isFallback) {
          acc.push({
            ...command,
            group: `Or use "${cleanedQuery}" with...`,
            metadata: { ...command.metadata, fallbackStr: cleanedQuery },
          });
        }

        return acc;
      }, []);
    }

    return result;
  }, []);

  const workflowCommands = useMemo<CommandListItemWorkflow[]>(() => {
    if (workflowQuery.state !== 'idle') return [];

    return workflowQuery.data.map((workflow) => {
      return {
        group: 'Workflows',
        icon: workflow.icon,
        title: workflow.name,
        subtitle: 'Workflow',
        value: `workflow:${workflow.id}`,
        metadata: {
          type: 'workflow',
          workflowId: workflow.id,
        },
      };
    });
  }, [workflowQuery]);
  const extensionCommands = useMemo(() => {
    const commandItems: CommandListItemCommand[] = [];
    const suggestionItems: CommandListItemCommand[] = [];
    const extensionItems: CommandListItemExtension[] = [];

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

      if (!builtInExtensionIds.includes(extension.id)) {
        extensionItems.push({
          group: 'Extensions',
          icon: extensionIcon,
          subtitle: 'Extension',
          title: extension.title,
          value: 'extension:' + extension.id,
          metadata: {
            type: 'extension',
            extension: extension,
          },
        });
      }

      if (extension.isError || extension.isDisabled) return;

      extension.commands.forEach((command) => {
        // let browserCtx: ExtensionBrowserTabContext | undefined;

        const isInSuggestion = false;
        // const showCommand = command.context
        //   ? command.context.some((context) => {
        //       if (context.startsWith('host')) {
        //         if (!activeBrowserTab) return false;

        //         const hostCtx = context.slice(
        //           context.indexOf(':') + 1,
        //           context.length - 1,
        //         );
        //         isInSuggestion = new URLPattern(hostCtx).test(
        //           activeBrowserTab.url,
        //         );

        //         browserCtx = activeBrowserTab;

        //         return isInSuggestion;
        //       } else if (context === 'all') {
        //         return true;
        //       }

        //       return false;
        //     })
        //   : true;

        // if (!showCommand) return;

        const commandItem: CommandListItemCommand = {
          metadata: {
            command,
            extension,
            type: 'command',
            isFallback: command.isFallback ?? false,
            commandIcon: command.icon ?? extension.icon,
          },
          alias: command.alias ?? undefined,
          value: `command:${extension.id}:${command.name}`,
          subtitle:
            command.customSubtitle || command.subtitle || extension.title,
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
          group: isInSuggestion ? 'Suggestions' : 'Commands',
        };

        isInSuggestion
          ? suggestionItems.push(commandItem)
          : commandItems.push(commandItem);
      });
    });

    return { suggestionItems, commandItems, extensionItems };
  }, [extensionQuery]);
  const builtInCommands: CommandListItemCommandBuiltIn[] = [
    {
      group: 'Commands',
      title: 'Import Extension',
      value: 'import-extension',
      subtitle: 'Utils',
      icon: <UiList.Icon icon={BlocksIcon} />,
      async onSelected() {
        try {
          const {
            filePaths: [manifestPath],
          } = await preloadAPI.main.ipc.invokeWithError('dialog:open', {
            buttonLabel: 'Import',
            properties: ['openFile'],
            title: 'Import Extension',
            filters: [{ extensions: ['json'], name: 'Extension manifest' }],
          });
          if (!manifestPath) return;

          const result = await preloadAPI.main.ipc.invoke(
            'extension:import',
            manifestPath,
          );
          if (!result) return;

          if (isIPCEventError(result)) {
            await preloadAPI.main.ipc.invoke('dialog:message-box', {
              type: 'error',
              message: `Error when trying to import extension:\n\n${result.message}`,
            });
            return;
          }

          preloadAPI.main.ipc.send('data:changes', 'extension');

          const inputExtensionConfig =
            !result.isError && result.config?.some((item) => item.required);
          if (inputExtensionConfig) {
            navigate(`/configs/${result.id}`);
          }
        } catch (error) {
          console.error(error);
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
    {
      group: 'Commands',
      title: 'Running process',
      value: 'running-process',
      subtitle: 'Utils',
      icon: <UiList.Icon icon={CpuIcon} />,
      onSelected() {
        navigate('/running-process');
      },
      metadata: {
        type: 'builtin-command',
      },
    },
    {
      group: 'Commands',
      title: 'Create Command Script',
      value: 'create-command-script',
      subtitle: 'Utils',
      icon: <UiList.Icon icon={FileCodeIcon} />,
      onSelected() {
        navigate('/create-command-script');
      },
      metadata: {
        type: 'builtin-command',
      },
    },
    {
      group: 'Commands',
      title: 'Fallback Commands',
      value: 'fallback-commands',
      subtitle: 'Utils',
      icon: <UiList.Icon icon={SearchSlashIcon} />,
      onSelected() {
        navigate('/fallback-commands');
      },
      metadata: {
        type: 'builtin-command',
      },
    },
  ];

  useEffect(() => {
    const aliases: Set<string> = new Set();
    extensionQuery.data?.forEach((extension) => {
      extension.commands.forEach((command) => {
        if (!command.alias) return;

        aliases.add(command.alias);
      });
    });

    useCommandStore.getState().setCommandAliases(aliases);
  }, [extensionQuery]);

  return (
    <UiList
      className="p-2"
      items={[
        ...extensionCommands.suggestionItems,
        ...extensionCommands.commandItems,
        ...builtInCommands,
        ...extensionCommands.extensionItems,
        ...workflowCommands,
        ...dashboardPageCommands,
      ]}
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
          case 'workflow':
            return (
              <ListItemWorkflow
                itemRef={ref}
                item={commandItem as CommandListItemWorkflow}
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
  );
}

export default memo(CommandList);
