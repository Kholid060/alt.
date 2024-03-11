import { useContext } from 'react';
import { CommandContext } from '../context/command.context';
import { ExtensionCommand } from '@repo/extension-core';
import { useCommandStore } from '../stores/command.store';
import { useToast } from '@repo/ui';
import emitter from '../lib/mitt';
import { useCommandRouteStore } from '../stores/command-route.store';

export function useCommandCtx() {
  const { toast } = useToast();
  const context = useContext(CommandContext);

  function executeCommand({
    command,
    extension,
  }: {
    extension: { id: string; name: string };
    command: ExtensionCommand;
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

      commandStore.setCommandArgs(
        {
          args: {},
          commandId: '',
        },
        true,
      );
    }

    if (command.type === 'view') {
      const navigate = useCommandRouteStore.getState().navigate;
      navigate(`/extensions/${extension.id}/${command.name}/view`, {
        breadcrumbs: [
          { label: extension.name, path: '' },
          { label: command.title, path: `/extensions/${extension.id}` },
        ],
        data: args,
      });
      return;
    }

    emitter.emit('execute-command', {
      args,
      commandId: command.name,
      extensionId: extension.id,
    });
  }

  return { ...context, executeCommand };
}
