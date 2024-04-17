import type { NativeImage } from 'electron';
import { dialog, nativeImage } from 'electron';
import ExtensionLoader from './extension/ExtensionLoader';
import { logger } from '../lib/log';
import type { ExtensionCommandArgument } from '@repo/extension-core';
import { parseJSON } from '@repo/shared';
import { store } from '../lib/store';
import { CommandLaunchBy } from '@repo/extension';
import DatabaseService from '../services/database.service';
import extensionCommandRunner from './extension/extensionCommandRunner';

function convertArgValue(argument: ExtensionCommandArgument, value: string) {
  let convertedValue: unknown = value;

  switch (argument.type) {
    case 'toggle':
      convertedValue = Boolean(parseJSON(value, null));
      break;
    case 'input:number':
      convertedValue = parseInt(value);
      break;
  }

  return convertedValue;
}

async function deepLinkHandler(deepLink: string) {
  try {
    const { hostname, pathname, searchParams } = new URL(deepLink);
    if (hostname !== 'extensions') return;

    const [_, extensionId, commandName] = pathname.split('/');

    const extension = await DatabaseService.getExtension(extensionId);
    if (!extension || extension.isDisabled || extension.isError) return;

    const command = extension.commands.find(
      (item) => item.name === commandName,
    );
    if (!command) return;

    let commandIcon: NativeImage | undefined;
    if (command.icon && !command.icon.startsWith('icon:')) {
      commandIcon = nativeImage.createFromPath(
        ExtensionLoader.instance.getPath(extensionId, 'icon', command.icon)!,
      );
    }

    const bypassCommands = store.get('bypassCommands') ?? [];
    const bypassCommandId = `${extensionId}:${commandName}`;

    const hideAlertDialog = bypassCommands.includes(bypassCommandId);

    if (!hideAlertDialog) {
      const { response } = await dialog.showMessageBox({
        type: 'question',
        icon: commandIcon,
        message: `Run ${command.title} command?`,
        detail:
          'This command was initiated from outside of the app. If you didn\'t initiate this, click the "Cancel" button.',
        buttons: ['Cancel', 'Run Anyway', 'Always Run'],
      });
      if (response === 0) return;

      if (response === 2) {
        store.set(
          'bypassCommands',
          Array.from(new Set([...bypassCommands, bypassCommandId])),
        );
      }
    }

    const args: Record<number, string> = {};
    searchParams.forEach((value, key) => {
      if (!key.startsWith('arg_')) return;

      const argIndex = +key.split('_')[1];
      if (argIndex < 0 || Number.isNaN(argIndex)) return;

      args[argIndex] = value;
    });

    const requiredArgs: { name: string; index: number }[] = [];
    const commandArgs =
      command.arguments?.reduce<Record<string, unknown>>(
        (acc, argument, index) => {
          if (Object.hasOwn(args, index)) {
            acc[argument.name] = convertArgValue(argument, args[index]);
          } else if (argument.required) {
            requiredArgs.push({
              index,
              name: argument.placeholder ?? argument.name,
            });
          }

          return acc;
        },
        {},
      ) ?? {};

    if (requiredArgs.length > 0) {
      const requiredArgsStr = requiredArgs
        .map((arg) => `- ${arg.name} (arg_${arg.index})`)
        .join('\n');
      dialog.showMessageBox({
        type: 'error',
        title: 'Missing Command Arguments',
        message: `The "${command.name}" is required these arguments:\n${requiredArgsStr}`,
      });
      return;
    }

    const launchContext = {
      args: commandArgs,
      launchBy: CommandLaunchBy.DEEP_LINK,
    };

    await extensionCommandRunner({
      command,
      extension,
      launchContext,
    });
  } catch (error) {
    logger('error', ['deepLinkHandler'], (error as Error).message);
  }
}

export default deepLinkHandler;
