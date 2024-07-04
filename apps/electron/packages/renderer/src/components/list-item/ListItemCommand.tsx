import { UiList, UiListItemAction } from '@alt-dot/ui';
import { ListItemRenderDetail } from '../../apps/command/routes/CommandList';
import preloadAPI from '/@/utils/preloadAPI';
import { useCommandPanelStore } from '/@/stores/command-panel.store';
import {
  BoltIcon,
  LinkIcon,
  ToggleLeftIcon,
  ToggleRightIcon,
} from 'lucide-react';
import { useCommandStore } from '/@/stores/command.store';
import { CommandLaunchBy } from '@alt-dot/extension';
import { useCommandNavigate } from '/@/hooks/useCommandRoute';
import { useCommandCtx } from '/@/hooks/useCommandCtx';
import CommandShortcut from '../ui/UiShortcut';
import DeepLinkURL from '#packages/common/utils/DeepLinkURL';
import { isIPCEventError } from '#packages/common/utils/helper';

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
            title: 'Fill out the required form before running the command',
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
            if (!isIPCEventError(value)) {
              addPanelStatus({
                type: 'success',
                title: 'Copied to clipboard',
              });
            }
          });
      },
      icon: LinkIcon,
      title: 'Copy Deep Link',
      value: 'copy-deeplink',
    },
    {
      onAction() {
        preloadAPI.main.ipc.invoke(
          'database:update-extension-command',
          command.extensionId,
          command.name,
          { isDisabled: !command.isDisabled },
        );
      },
      value: 'toggle-command',
      title: command.isDisabled ? 'Enable' : 'Disable',
      icon: command.isDisabled ? ToggleLeftIcon : ToggleRightIcon,
    },
  ];
  if (command.config && command.config.length > 0) {
    actions.splice(1, 0, {
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
      className={command.isDisabled ? 'opacity-60' : ''}
      alias={
        item.alias && (
          <span className="ml-1 rounded border px-1">{item.alias}</span>
        )
      }
      suffix={
        <div className="space-x-3">
          {command.type === 'script' && (
            <span className="text-xs text-muted-foreground">
              Command Script
            </span>
          )}
          {command.shortcut && (
            <span>
              <CommandShortcut shortcut={command.shortcut} />
            </span>
          )}
        </div>
      }
      onSelected={startExecuteCommand}
    />
  );
}

export default ListItemCommand;
