import { UiList } from '@repo/ui';
import { ListItemRenderDetail } from '/@/routes/CommandList';
import preloadAPI from '/@/utils/preloadAPI';
import { useCommandPanelStore } from '/@/stores/command-panel.store';
import { APP_DEEP_LINK } from '#common/utils/constant/constant';
import { LinkIcon } from 'lucide-react';
import { useCommandStore } from '/@/stores/command.store';
import { ExtensionCommand } from '@repo/extension-core';
import { useCommand } from '/@/hooks/useCommand';
import { CommandLaunchBy } from '@repo/extension';

function ListItemCommand({
  item,
  props,
  itemRef,
  selected,
}: ListItemRenderDetail<'command'>) {
  const addPanelStatus = useCommandPanelStore.use.addStatus();

  const { executeCommand } = useCommand();

  const { command, extensionId, extensionTitle } = item.metadata;

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
      launchContext: {
        args,
        launchBy: CommandLaunchBy.USER,
      },
      command,
      extensionId: extension.id,
      extensionName: extension.name,
    });
  }

  return (
    <UiList.Item
      ref={itemRef}
      {...{ ...props, ...item, selected }}
      actions={[
        {
          onAction() {
            preloadAPI.main
              .invokeIpcMessage(
                'clipboard:copy',
                `${APP_DEEP_LINK}://extensions/${extensionId}/${command.name}`,
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
      ]}
      suffix={
        command.type === 'script' ? (
          <span className="text-xs text-muted-foreground">Command Script</span>
        ) : undefined
      }
      onSelected={() =>
        startExecuteCommand({
          command,
          extension: { id: extensionId, name: extensionTitle },
        })
      }
    />
  );
}

export default ListItemCommand;
