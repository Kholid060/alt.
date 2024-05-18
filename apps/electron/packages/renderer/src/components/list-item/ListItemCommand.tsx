import { UiList, UiListItemAction } from '@repo/ui';
import { ListItemRenderDetail } from '../../apps/command/routes/CommandList';
import preloadAPI from '/@/utils/preloadAPI';
import { useCommandPanelStore } from '/@/stores/command-panel.store';
import { BoltIcon, LinkIcon } from 'lucide-react';
import { useCommandStore } from '/@/stores/command.store';
import { CommandLaunchBy } from '@repo/extension';
import { useCommandNavigate } from '/@/hooks/useCommandRoute';
import { useCommandCtx } from '/@/hooks/useCommandCtx';
import CommandShortcut from '../ui/UiShortcut';
import DeepLinkURL from '#packages/common/utils/DeepLinkURL';

function ListItemCommand({
  item,
  props,
  itemRef,
  selected,
}: ListItemRenderDetail<'command'>) {
  const addPanelStatus = useCommandPanelStore.use.addStatus();

  const navigate = useCommandNavigate();
  const { executeCommand } = useCommandCtx();

  const { command, extension } = item.metadata;

  function startExecuteCommand() {
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
    }

    executeCommand({
      commandId: command.name,
      extensionId: command.extensionId,
      launchContext: {
        args,
        launchBy: CommandLaunchBy.USER,
        fallbackSearch: item.metadata.fallbackStr,
      },
    });
  }

  const actions: UiListItemAction[] = [
    {
      onAction() {
        preloadAPI.main.ipc
          .invoke(
            'clipboard:copy',
            DeepLinkURL.getExtensionCommand(extension.id, command.name),
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
  ];
  if (command.config && command.config.length > 0) {
    actions.push({
      icon: BoltIcon,
      onAction() {
        navigate(`/configs/${extension.id}:${command.name}`);
      },
      title: 'Config',
      value: 'config',
      shortcut: { key: ',', mod1: 'ctrlKey' },
    });
  }

  return (
    <UiList.Item
      ref={itemRef}
      {...{ ...props, ...item, selected }}
      actions={actions}
      suffix={
        <div className="space-x-3">
          {command.shortcut && (
            <span>
              <CommandShortcut shortcut={command.shortcut} />
            </span>
          )}
          {command.type === 'script' && (
            <span className="text-xs text-muted-foreground">
              Command Script
            </span>
          )}
        </div>
      }
      onSelected={startExecuteCommand}
    />
  );
}

export default ListItemCommand;
